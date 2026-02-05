import express from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import sanitizeHtml from 'sanitize-html';
import { getHighlighter } from 'shiki';
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const app = express();
app.use(express.json({ limit: '2mb' }));

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const jobSchema = z.object({
  issueId: z.string().uuid()
});

let highlighterPromise;
async function getShiki() {
  if (!highlighterPromise) {
    highlighterPromise = getHighlighter({
      themes: ['tokyo-night', 'github-light'],
      langs: ['plaintext', 'javascript', 'typescript', 'tsx', 'jsx', 'json', 'bash', 'html', 'css', 'python', 'go', 'rust']
    });
  }
  return highlighterPromise;
}

let chromePathPromise;
async function ensureChrome() {
  if (!chromePathPromise) {
    chromePathPromise = (async () => {
      const resolvePath = () => {
        if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
        try {
          return puppeteer.executablePath();
        } catch {
          return null;
        }
      };

      let executablePath = resolvePath();
      if (executablePath && fs.existsSync(executablePath)) {
        return executablePath;
      }

      try {
        execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
      } catch (error) {
        throw new Error('Chrome install failed. Ensure Render build runs puppeteer install.');
      }

      executablePath = resolvePath();
      if (!executablePath || !fs.existsSync(executablePath)) {
        throw new Error('Chrome executable not found after install.');
      }

      return executablePath;
    })();
  }
  return chromePathPromise;
}

const ALLOWED_HOSTS = (process.env.ALLOWED_URL_HOSTS ?? '')
  .split(/[\s,]+/)
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

app.post('/jobs/issue', async (req, res) => {
  const secret = req.header('x-worker-secret');
  if (process.env.WORKER_SHARED_SECRET && secret !== process.env.WORKER_SHARED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let payload;
  try {
    payload = jobSchema.parse(req.body);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    await processIssue(payload.issueId);
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    await supabase.from('issues').update({ status: 'failed' }).eq('id', payload.issueId);
    const { data: issueRow } = await supabase
      .from('issues')
      .select('user_id')
      .eq('id', payload.issueId)
      .maybeSingle();
    await supabase.from('events').insert({
      user_id: issueRow?.user_id ?? null,
      issue_id: payload.issueId,
      type: 'issue_failed',
      metadata: { message: error instanceof Error ? error.message : 'Unknown error' }
    });
    return res.status(500).json({ error: 'Processing failed' });
  }
});

async function processIssue(issueId) {
  const { data: issueRow } = await supabase
    .from('issues')
    .select('id,user_id,title,theme,status')
    .eq('id', issueId)
    .single();

  if (!issueRow) throw new Error('Issue not found');
  const issue = { ...issueRow };

  const { error: processingError } = await supabase
    .from('issues')
    .update({ status: 'processing' })
    .eq('id', issueId);
  if (processingError) throw new Error(`Unable to update status: ${processingError.message}`);

  const { data: links } = await supabase
    .from('links')
    .select('id,url,source_type,order_index')
    .eq('issue_id', issueId)
    .order('order_index');

  if (!links?.length) throw new Error('No links');

  const chapters = [];
  for (const link of links) {
    if (!isSafeUrl(link.url)) {
      const fallback = {
        title: 'Blocked URL',
        content: '<p>URL blocked for safety.</p>',
        wordCount: 0,
        imageCount: 0,
        codeCount: 0,
        tweetCount: 0,
        sourceUrl: link.url
      };
      chapters.push(fallback);
      await supabase
        .from('links')
        .update({
          parsed_json: {
            title: fallback.title,
            blocked: true,
            wordCount: fallback.wordCount,
            imageCount: fallback.imageCount,
            codeCount: fallback.codeCount,
            tweetCount: fallback.tweetCount,
            sourceUrl: fallback.sourceUrl
          }
        })
        .eq('id', link.id);
      continue;
    }
    try {
      const chapter = link.source_type === 'x' ? await parseX(link.url) : await parseArticle(link.url);
      chapters.push(chapter);
      await supabase
        .from('links')
        .update({
          parsed_json: {
            title: chapter.title,
            wordCount: chapter.wordCount,
            imageCount: chapter.imageCount,
            codeCount: chapter.codeCount,
            tweetCount: chapter.tweetCount,
            sourceUrl: chapter.sourceUrl
          }
        })
        .eq('id', link.id);
    } catch (error) {
      const fallback = {
        title: 'Link unavailable',
        content: '<p>We could not fetch this link. The Issue was generated without it.</p>',
        wordCount: 0,
        imageCount: 0,
        codeCount: 0,
        tweetCount: 0,
        sourceUrl: link.url
      };
      chapters.push(fallback);
      await supabase
        .from('links')
        .update({
          parsed_json: {
            title: fallback.title,
            error: true,
            wordCount: fallback.wordCount,
            imageCount: fallback.imageCount,
            codeCount: fallback.codeCount,
            tweetCount: fallback.tweetCount,
            sourceUrl: fallback.sourceUrl
          }
        })
        .eq('id', link.id);
    }
  }

  const metrics = chapters.reduce(
    (acc, chapter) => {
      acc.words += chapter.wordCount;
      acc.images += chapter.imageCount;
      acc.code += chapter.codeCount;
      acc.tweets += chapter.tweetCount;
      return acc;
    },
    { words: 0, images: 0, code: 0, tweets: 0 }
  );

  const resolvedTitle = resolveIssueTitle(issue.title, links, chapters);
  if (resolvedTitle !== issue.title) {
    const { error: titleError } = await supabase
      .from('issues')
      .update({ title: resolvedTitle })
      .eq('id', issueId);
    if (titleError) throw new Error(`Unable to normalize title: ${titleError.message}`);
    issue.title = resolvedTitle;
  }

  const cappedImages = Math.min(metrics.images, 12);
  const cappedCode = Math.min(metrics.code, 25);
  const complexityScore = Math.ceil(metrics.words / 500) + cappedImages * 2 + cappedCode * 2 + metrics.tweets;

  const { data: user } = await supabase
    .from('users')
    .select('daily_credits,credits_reset_at,email')
    .eq('id', issue.user_id)
    .single();

  const credits = normalizeCredits(user?.daily_credits ?? 20, user?.credits_reset_at);
  if (credits.needsReset) {
    const { error: resetError } = await supabase
      .from('users')
      .update({ daily_credits: credits.available, credits_reset_at: credits.nextReset })
      .eq('id', issue.user_id);
    if (resetError) throw new Error(`Unable to reset credits: ${resetError.message}`);
  }
  if (complexityScore > credits.available) {
    const { error: rejectError } = await supabase
      .from('issues')
      .update({ status: 'rejected', complexity_score: complexityScore })
      .eq('id', issueId);
    if (rejectError) throw new Error(`Unable to mark rejected: ${rejectError.message}`);
    await supabase.from('events').insert({
      user_id: issue.user_id,
      issue_id: issueId,
      type: 'issue_rejected',
      metadata: { complexity_score: complexityScore, credits_available: credits.available }
    });
    return;
  }

  const { error: creditError } = await supabase
    .from('users')
    .update({ daily_credits: credits.available - complexityScore, credits_reset_at: credits.nextReset })
    .eq('id', issue.user_id);
  if (creditError) throw new Error(`Unable to update credits: ${creditError.message}`);

  const html = await renderIssueHtml(issue, chapters);
  const pdfBuffer = await renderPdf(html);
  const coverBuffer = await renderCoverImage(issue);

  const pdfPath = `${issueId}/issue.pdf`;
  const htmlPath = `${issueId}/issue.html`;
  const coverPath = `${issueId}/cover.png`;

  const { error: pdfError } = await supabase.storage.from('issues').upload(pdfPath, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true
  });
  if (pdfError) throw new Error(`PDF upload failed: ${pdfError.message}`);

  const { error: htmlError } = await supabase.storage.from('issues').upload(htmlPath, Buffer.from(html), {
    contentType: 'text/html',
    upsert: true
  });
  if (htmlError) throw new Error(`HTML upload failed: ${htmlError.message}`);

  const { error: coverError } = await supabase.storage.from('issues').upload(coverPath, coverBuffer, {
    contentType: 'image/png',
    upsert: true
  });
  if (coverError) throw new Error(`Cover upload failed: ${coverError.message}`);

  const { error: assetsError } = await supabase.from('assets').upsert({
    issue_id: issueId,
    pdf_url: pdfPath,
    html_url: htmlPath,
    cover_url: coverPath
  });
  if (assetsError) throw new Error(`Asset upsert failed: ${assetsError.message}`);

  const { error: issueUpdateError } = await supabase
    .from('issues')
    .update({ status: 'ready', complexity_score: complexityScore })
    .eq('id', issueId);
  if (issueUpdateError) throw new Error(`Issue update failed: ${issueUpdateError.message}`);

  await supabase.from('events').insert({
    user_id: issue.user_id,
    issue_id: issueId,
    type: 'issue_completed',
    metadata: { complexity_score: complexityScore }
  });

  await sendCompletionEmail(user?.email, issue.title, issueId);
}

function normalizeCredits(available, lastReset) {
  const now = new Date();
  const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  if (!lastReset) {
    return { available: 20, nextReset: nextReset.toISOString(), needsReset: true };
  }

  const resetAt = new Date(lastReset);
  if (Number.isNaN(resetAt.getTime()) || resetAt <= now) {
    return { available: 20, nextReset: nextReset.toISOString(), needsReset: true };
  }

  return { available, nextReset: resetAt.toISOString(), needsReset: false };
}

async function parseArticle(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'IssueBot/1.0'
    }
  });
  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    return {
      title: new URL(url).hostname,
      content: `<p>Unable to parse this article.</p>`,
      wordCount: 0,
      imageCount: 0,
      codeCount: 0,
      tweetCount: 0
    };
  }

  const clean = sanitizeHtml(article.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'pre', 'code', 'h1', 'h2', 'h3', 'blockquote']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt'],
      code: ['class']
    }
  });

  const metricsDom = new JSDOM(clean);
  const images = Array.from(metricsDom.window.document.querySelectorAll('img'));
  images.slice(12).forEach((img) => img.remove());
  const imageCount = Math.min(images.length, 12);
  const codeCount = metricsDom.window.document.querySelectorAll('pre code').length;
  const wordCount = metricsDom.window.document.body.textContent?.split(/\s+/).filter(Boolean).length ?? 0;
  const sanitizedContent = metricsDom.window.document.body.innerHTML;

  return {
    title: article.title || new URL(url).hostname,
    content: sanitizedContent,
    wordCount,
    imageCount,
    codeCount,
    tweetCount: 0,
    sourceUrl: url
  };
}

async function parseX(url) {
  const executablePath = await ensureChrome();
  const browser = await puppeteer.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

  const tweets = await page.$$eval('article div[data-testid="tweetText"]', (nodes) =>
    nodes.map((node) => node.innerText)
  );

  await browser.close();

  const safeTweets = tweets.length ? tweets : ['Unable to extract tweets.'];
  const tweetHtml = safeTweets
    .map((tweet) => `<blockquote class="tweet">${escapeHtml(tweet)}</blockquote>`)
    .join('');

  const wordCount = safeTweets.join(' ').split(/\s+/).filter(Boolean).length;

  return {
    title: 'X Thread',
    content: tweetHtml,
    wordCount,
    imageCount: 0,
    codeCount: 0,
    tweetCount: safeTweets.length,
    sourceUrl: url
  };
}

async function highlightCode(html, theme) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const codeBlocks = document.querySelectorAll('pre code');
  if (!codeBlocks.length) {
    return { html, codeCount: 0 };
  }

  const highlighter = await getShiki();
  let count = 0;

  for (const node of codeBlocks) {
    const parent = node.parentElement;
    const raw = node.textContent || '';
    const lang = guessLanguage(node.className);
    let highlighted;
    try {
      highlighted = highlighter.codeToHtml(raw, { lang, theme });
    } catch (error) {
      try {
        highlighted = highlighter.codeToHtml(raw, { lang: 'plaintext', theme });
      } catch {
        continue;
      }
    }

    if (parent) {
      parent.outerHTML = highlighted;
      count += 1;
    }
  }

  return { html: document.body.innerHTML, codeCount: count };
}

function guessLanguage(className) {
  const match = className?.match(/language-([\w-]+)/);
  return match?.[1] || 'plaintext';
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, ' ');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isSafeUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname.endsWith('.local')) return false;
    const ipMatch = hostname.match(/^(\\d{1,3}\\.){3}\\d{1,3}$/);
    if (!ipMatch) return isAllowedHost(hostname);
    const parts = hostname.split('.').map(Number);
    if (parts[0] === 10) return false;
    if (parts[0] === 127) return false;
    if (parts[0] === 192 && parts[1] === 168) return false;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
    return isAllowedHost(hostname);
  } catch {
    return false;
  }
}

function isAllowedHost(hostname) {
  if (!ALLOWED_HOSTS.length) {
    return false;
  }

  const host = hostname.toLowerCase();
  return ALLOWED_HOSTS.some((entry) => {
    if (entry === '*') return true;
    if (entry.startsWith('*.')) {
      const root = entry.slice(2);
      return host === root || host.endsWith(`.${root}`);
    }
    if (entry.startsWith('.')) {
      const root = entry.slice(1);
      return host === root || host.endsWith(`.${root}`);
    }
    return host === entry;
  });
}

async function renderIssueHtml(issue, chapters) {
  const theme = issue.theme === 'developer' ? 'developer' : 'journal';
  const shikiTheme = theme === 'developer' ? 'tokyo-night' : 'github-light';

  const processed = [];
  for (const chapter of chapters) {
    const updated = await highlightCode(chapter.content, shikiTheme);
    processed.push({ ...chapter, content: updated.html });
  }

  const toc = processed
    .map((chapter, index) => `<li><span>${index + 1}. ${escapeHtml(chapter.title)}</span></li>`)
    .join('');

  const body = processed
    .map(
      (chapter, index) => `
      <section class="chapter">
        <h2>${index + 1}. ${escapeHtml(chapter.title)}</h2>
        <p class="source">Source: ${escapeHtml(chapter.sourceUrl || '')}</p>
        ${chapter.content}
      </section>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(issue.title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Manrope:wght@300;400;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
    <style>
      @page { size: A4; margin: 24mm; }
      body { margin: 0; font-family: 'Manrope', sans-serif; color: ${theme === 'journal' ? '#1c1b1a' : '#f3f4f6'}; background: ${
        theme === 'journal' ? '#f8f5ef' : '#11131a'
      }; }
      .cover { display: flex; flex-direction: column; justify-content: center; height: 100vh; padding: 72px; background: ${
        theme === 'journal' ? '#f1ede5' : '#0f1117'
      }; page-break-after: always; }
      .cover h1 { font-family: 'Fraunces', serif; font-size: 42px; margin: 0 0 12px; color: ${
        theme === 'journal' ? '#1c1b1a' : '#f3f4f6'
      }; }
      .cover p { margin: 0; font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; color: ${
        theme === 'journal' ? '#4a4340' : '#8c93a5'
      }; }
      .toc { padding: 40px 72px; page-break-after: always; }
      .toc h2 { font-family: 'Fraunces', serif; }
      .toc ul { list-style: none; padding: 0; margin: 16px 0 0; }
      .toc li { margin-bottom: 8px; font-size: 14px; }
      .chapter { padding: 24px 72px; page-break-after: always; }
      .chapter h2 { font-family: 'Fraunces', serif; margin-top: 32px; }
      .source { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: ${theme === 'journal' ? '#6b625e' : '#8c93a5'}; }
      pre { background: ${theme === 'developer' ? '#0b0b0e' : '#1f1f1f'}; color: #f5f5f5; padding: 16px; border-radius: 12px; overflow: auto; }
      code { font-family: 'JetBrains Mono', monospace; font-size: 13px; }
      img { max-width: 100%; border-radius: 12px; margin: 16px 0; }
      blockquote.tweet { border-left: 3px solid ${theme === 'developer' ? '#7b869d' : '#b89062'}; padding-left: 12px; margin: 12px 0; color: ${
        theme === 'developer' ? '#f3f4f6' : '#4a4340'
      }; }
      footer { padding: 40px 72px; font-size: 12px; color: ${theme === 'journal' ? '#6b625e' : '#8c93a5'}; }
      a { color: inherit; }
    </style>
  </head>
  <body>
    <div class="cover">
      <p>Issue</p>
      <h1>${escapeHtml(issue.title)}</h1>
      <p>Curated · ${new Date().toLocaleDateString('en-US')}</p>
    </div>
    <div class="toc">
      <h2>Contents</h2>
      <ul>${toc}</ul>
    </div>
    ${body}
    <footer>Personal use only. Sources are attributed to the original authors.</footer>
  </body>
</html>`;
}

function resolveIssueTitle(currentTitle, links, chapters) {
  const fallbackFromLink = deriveTitleFromUrl(links?.[0]?.url);
  const chapterTitle = chapters?.[0]?.title?.trim();

  if (currentTitle && !isLikelyUrl(currentTitle) && !isGenericIssueTitle(currentTitle)) {
    return currentTitle;
  }

  if (chapterTitle && !isGenericChapterTitle(chapterTitle)) {
    return `Issue — ${truncate(chapterTitle, 78)}`;
  }

  if (fallbackFromLink) {
    return fallbackFromLink;
  }

  return 'New Issue';
}

function deriveTitleFromUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace('www.', '');
    if (host === 'x.com' || host === 'twitter.com') {
      const username = parsed.pathname.split('/').filter(Boolean)[0];
      if (username && username !== 'i' && username !== 'home' && username !== 'explore') {
        return `Issue — @${username} thread`;
      }
      return 'Issue — X thread';
    }
    return `Issue — ${host}`;
  } catch {
    return null;
  }
}

function isLikelyUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isGenericIssueTitle(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'new issue') return true;
  if (normalized === 'issue') return true;
  if (normalized === 'issue — x thread') return true;
  return /^issue\s+[—-]\s+(x\.com|twitter\.com)$/i.test(normalized);
}

function isGenericChapterTitle(value) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === 'x thread' ||
    normalized === 'link unavailable' ||
    normalized === 'blocked url' ||
    normalized === 'unable to parse this article.'
  );
}

function truncate(value, length) {
  if (value.length <= length) return value;
  return `${value.slice(0, Math.max(0, length - 1)).trimEnd()}…`;
}

async function renderPdf(html) {
  const executablePath = await ensureChrome();
  const browser = await puppeteer.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true
  });
  await browser.close();
  return pdf;
}

async function renderCoverImage(issue) {
  const theme = issue.theme === 'developer' ? 'developer' : 'journal';
  const background = theme === 'journal' ? '#f1ede5' : '#0f1117';
  const text = theme === 'journal' ? '#1c1b1a' : '#f3f4f6';
  const accent = theme === 'journal' ? '#b89062' : '#7b869d';
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=Manrope:wght@400;600&display=swap" rel="stylesheet" />
      <style>
        body { margin: 0; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: ${background}; }
        .card { width: 780px; height: 1040px; border-radius: 36px; padding: 72px; box-sizing: border-box;
          background: ${background}; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 40px 80px rgba(15,18,26,0.25); }
        .eyebrow { font-family: 'Manrope', sans-serif; letter-spacing: 0.35em; text-transform: uppercase; font-size: 12px; color: ${accent}; }
        h1 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 48px; line-height: 1.1; color: ${text}; margin: 24px 0 18px; }
        .meta { font-family: 'Manrope', sans-serif; font-size: 14px; color: ${text}; opacity: 0.7; letter-spacing: 0.2em; text-transform: uppercase; }
        .rule { height: 1px; background: ${accent}; opacity: 0.4; margin: 32px 0; }
        .brand { font-family: 'Manrope', sans-serif; font-size: 13px; letter-spacing: 0.4em; text-transform: uppercase; color: ${text}; opacity: 0.6; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="eyebrow">Curated Issue</div>
        <h1>${escapeHtml(issue.title)}</h1>
        <div class="meta">${new Date().toLocaleDateString('en-US')} · A4</div>
        <div class="rule"></div>
        <div class="brand">Issue</div>
      </div>
    </body>
  </html>`;

  const executablePath = await ensureChrome();
  const browser = await puppeteer.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const buffer = await page.screenshot({ type: 'png' });
  await browser.close();
  return buffer;
}

async function sendCompletionEmail(email, title, issueId) {
  if (!email || !process.env.RESEND_API_KEY || !process.env.APP_BASE_URL) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Issue <studio@issue.app>',
      to: email,
      subject: `Your Issue is ready — ${title}`,
      html: `<p>Your Issue is ready.</p><p><a href="${process.env.APP_BASE_URL}/app">Open your library</a></p>`
    })
  });
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Worker running on :${port}`);
});
