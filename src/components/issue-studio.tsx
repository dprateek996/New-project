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
    if (draft) {
      setUrls(draft);
      localStorage.removeItem('issue:draft');
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
          const data = (await response.json()) as IssueRow;
          return data;
        })
      );

      setIssues((current) =>
        current.map((issue) => updates.find((update) => update.id === issue.id) ?? issue)
      );
    }, 8000);

    return () => clearInterval(interval);
  }, [issues]);

  const parsedUrls = useMemo(() =>
    urls
      .split(/\n|,/)
      .map((url) => url.trim())
      .filter(Boolean),
  [urls]);

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
        const body = await response.json();
        setStatus(body.error ?? 'Unable to craft Issue.');
        return;
      }

      const issue = (await response.json()) as IssueRow;
      setIssues((current) => [issue, ...current]);
      setUrls('');
      setTitle('');
      setStatus('Crafting started. You will receive an email when it is ready.');
    } catch (error) {
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

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mono text-xs uppercase tracking-[0.3em] text-white/40">Your Studio</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold">Issue Library</h1>
          <p className="mt-2 text-sm text-white/60">Signed in as {userEmail}</p>
        </div>
        <span className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/40">
          Credits refresh daily
        </span>
      </header>

      <section className="card-glass mt-10 rounded-[32px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-semibold">Craft a new Issue</h2>
            <p className="mt-2 text-sm text-white/60">
              Paste 1–10 links. We will stitch them into a single Issue.
            </p>
          </div>
          <div className="flex gap-2">
            {themeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  theme === option
                    ? 'bg-accent-400 text-obsidian-950'
                    : 'border border-white/20 text-white/70'
                }`}
              >
                {THEMES[option].label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <textarea
            value={urls}
            onChange={(event) => setUrls(event.target.value)}
            placeholder="Paste links, one per line"
            className="input-shell min-h-[160px] w-full rounded-3xl px-6 py-5 text-sm"
          />
          <div className="flex flex-col gap-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional Issue title"
              className="input-shell rounded-2xl px-4 py-3 text-sm"
            />
            <div className="rounded-2xl border border-white/10 bg-obsidian-850 p-4 text-xs text-white/60">
              <p className="mono text-[10px] uppercase tracking-[0.3em] text-white/40">Complexity score</p>
              <p className="mt-2">Based on words, images, code blocks, and tweets. Credits reset daily.</p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-full bg-accent-400 px-4 py-3 text-sm font-semibold text-obsidian-950 transition hover:bg-accent-500 disabled:opacity-40"
            >
              {isSubmitting ? 'Crafting…' : 'Craft Issue'}
            </button>
          </div>
        </div>
        {status && <p className="mt-4 text-xs text-white/60">{status}</p>}
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {issues.length === 0 ? (
          <div className="card-glass rounded-3xl p-6 text-sm text-white/60">
            Your shelf is empty. Craft your first Issue.
          </div>
        ) : (
          issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onShareToggle={handleShareToggle} />
          ))
        )}
      </section>
    </div>
  );
}
