'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { IssueRow, ThemeKey } from '@/lib/types';
import { THEMES } from '@/lib/themes';
import { IssueCard } from '@/components/issue-card';

const themeOptions: ThemeKey[] = ['journal', 'developer'];

export function IssueStudio({
  userEmail,
  initialIssues
}: {
  userEmail: string;
  initialIssues: IssueRow[];
}) {
  const [issues, setIssues] = useState<IssueRow[]>(initialIssues);
  const [urls, setUrls] = useState('');
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<ThemeKey>('journal');
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRefreshed = useRef(false);

  useEffect(() => {
    const draft = localStorage.getItem('issue:draft');
    const storedTheme = localStorage.getItem('issue:theme') as ThemeKey | null;
    if (draft) {
      setUrls(draft);
      localStorage.removeItem('issue:draft');
    }
    if (storedTheme && themeOptions.includes(storedTheme)) {
      setTheme(storedTheme);
      localStorage.removeItem('issue:theme');
    }
  }, []);

  useEffect(() => {
    const refreshAll = async () => {
      const updates = await Promise.all(
        issues.map(async (issue) => {
          const response = await fetch(`/api/issue/${issue.id}`);
          if (!response.ok) return issue;
          return (await response.json()) as IssueRow;
        })
      );
      setIssues(updates);
    };

    if (!hasRefreshed.current && issues.length) {
      hasRefreshed.current = true;
      refreshAll();
    }
  }, [issues]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const pending = issues.filter((issue) => issue.status === 'queued' || issue.status === 'processing');
      if (!pending.length) return;

      const updates = await Promise.all(
        pending.map(async (issue) => {
          const response = await fetch(`/api/issue/${issue.id}`);
          if (!response.ok) return issue;
          return (await response.json()) as IssueRow;
        })
      );

      setIssues((current) =>
        current.map((issue) => updates.find((update) => update.id === issue.id) ?? issue)
      );
    }, 8000);

    return () => clearInterval(interval);
  }, [issues]);

  const parsedUrls = useMemo(
    () =>
      urls
        .split(/\n|,/)
        .map((url) => url.trim())
        .filter(Boolean),
    [urls]
  );

  const handleSubmit = async () => {
    setStatus(null);
    if (parsedUrls.length === 0) {
      setStatus('Paste at least one link.');
      return;
    }

    if (parsedUrls.length > 10) {
      setStatus('Limit is 10 links per Issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/issue/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: parsedUrls,
          theme,
          title: title.trim() || undefined
        })
      });

      if (!response.ok) {
        try {
          const body = await response.json();
          setStatus(body.error ?? 'Unable to craft Issue.');
        } catch {
          setStatus(`Server error (${response.status}).`);
        }
        return;
      }

      const issue = (await response.json()) as IssueRow;
      setIssues((current) => [issue, ...current]);
      setUrls('');
      setTitle('');
      setStatus('Crafting started. You will receive an email when it is ready.');
    } catch {
      setStatus('Network error. Try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareToggle = async (issueId: string, nextValue: boolean) => {
    const response = await fetch(`/api/issue/${issueId}/share`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: nextValue })
    });

    if (!response.ok) return;
    setIssues((current) =>
      current.map((issue) => (issue.id === issueId ? { ...issue, is_public: nextValue } : issue))
    );
  };

  const isJournal = theme === 'journal';

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.3em] text-white/46">Issue Studio</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight">Your private shelf for curated reading.</h1>
          <p className="mt-3 text-sm text-white/62">Signed in as {userEmail}</p>
        </div>
        <div className="panel-muted rounded-2xl px-4 py-3 text-xs text-white/62">
          <p className="mono text-[10px] uppercase tracking-[0.23em] text-white/50">Usage</p>
          <p className="mt-2">20 credits refresh daily at UTC midnight.</p>
        </div>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="card-glass rounded-[30px] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl">Craft a new Issue</h2>
              <p className="mt-2 text-sm text-white/62">Paste 1 to 10 links. We compose them into one publishable artifact.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1">
              {themeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTheme(option)}
                  className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] transition ${
                    theme === option ? 'bg-[#f0c996] text-[#1a1208]' : 'text-white/58 hover:text-white'
                  }`}
                >
                  {THEMES[option].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <textarea
              value={urls}
              onChange={(event) => setUrls(event.target.value)}
              placeholder="Paste links, one per line"
              className="input-shell min-h-[180px] w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
            />

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Optional Issue title"
                className="input-shell rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-45"
              >
                {isSubmitting ? 'Crafting...' : 'Craft Issue'}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/55">
              <span>{parsedUrls.length ? `${parsedUrls.length} link${parsedUrls.length > 1 ? 's' : ''} detected` : 'Paste links to begin'}</span>
              <span>Complexity score is based on words, images, code blocks, and tweets</span>
            </div>

            {status && <p className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs text-white/75">{status}</p>}
          </div>
        </div>

        <aside className="card-glass relative overflow-hidden rounded-[30px] p-6">
          <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full border border-white/10" />
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10 spin-slow" />
          <div className="relative">
            <div className="flex items-center justify-between text-xs text-white/58">
              <span className="mono text-[10px] tracking-[0.25em]">LIVE PREVIEW</span>
              <span>{THEMES[theme].label}</span>
            </div>

            <div className={`mt-5 rounded-2xl border p-5 ${
              isJournal
                ? 'border-[#bcae98]/35 bg-[#f3eadc] text-[#2b1f12]'
                : 'border-white/10 bg-[#101522] text-white'
            }`}>
              <p className={`mono text-[10px] uppercase tracking-[0.24em] ${isJournal ? 'text-[#5b4a33]' : 'text-white/55'}`}>
                Issue Cover
              </p>
              <h3 className={`mt-4 text-2xl leading-tight ${isJournal ? 'font-serif' : 'font-sans'}`}>
                {title.trim() || 'Architecture Notes for Reliable APIs'}
              </h3>
              <p className={`mt-4 text-sm ${isJournal ? 'text-[#4f4234]' : 'text-white/70'}`}>
                {THEMES[theme].description} with auto TOC, source attribution, and code-aware formatting.
              </p>
              <div className={`mt-6 h-24 rounded-xl ${
                isJournal
                  ? 'bg-gradient-to-br from-[#efe1cf] to-[#ddc8ad]'
                  : 'bg-gradient-to-br from-[#111a2e] to-[#1d2b42]'
              }`} />
            </div>

            <div className="mt-5 grid gap-2 text-xs text-white/63">
              <div className="panel-muted rounded-xl px-3 py-2">Output: A4 PDF + web reader</div>
              <div className="panel-muted rounded-xl px-3 py-2">Notifications: Email + in-app</div>
              <div className="panel-muted rounded-xl px-3 py-2">Sharing: Private by default, public toggle per Issue</div>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-3xl">Your Shelf</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">Private by default</span>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {issues.length === 0 ? (
            <div className="card-glass rounded-3xl p-6 text-sm text-white/66">Your shelf is empty. Craft your first Issue.</div>
          ) : (
            issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onShareToggle={handleShareToggle} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
