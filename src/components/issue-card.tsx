'use client';

import { useState } from 'react';
import type { IssueRow } from '@/lib/types';
import { formatDate } from '@/lib/format';

const statusLabel: Record<IssueRow['status'], string> = {
  queued: 'Queued',
  processing: 'Crafting',
  ready: 'Ready',
  failed: 'Failed',
  rejected: 'Too complex'
};

const statusTone: Record<IssueRow['status'], string> = {
  queued: 'border-white/10 text-white/60',
  processing: 'border-accent-400/40 text-accent-400',
  ready: 'border-emerald-400/40 text-emerald-300',
  failed: 'border-red-400/40 text-red-300',
  rejected: 'border-amber-400/40 text-amber-300'
};

export function IssueCard({
  issue,
  onShareToggle
}: {
  issue: IssueRow;
  onShareToggle: (issueId: string, nextValue: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const coverStyle = issue.assets?.cover_url
    ? { backgroundImage: `url(${issue.assets.cover_url})` }
    : undefined;
  const coverClassName = issue.assets?.cover_url
    ? 'bg-cover bg-center'
    : 'bg-[radial-gradient(circle_at_top,#1f2432,#0b0b10)]';

  const handleToggle = async () => {
    setBusy(true);
    await onShareToggle(issue.id, !issue.is_public);
    setBusy(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/share/${issue.id}`);
  };

  return (
    <div className="card-glass group flex flex-col rounded-3xl p-5 transition hover:-translate-y-1 hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mono text-xs uppercase tracking-[0.3em] text-white/40">{issue.theme}</p>
          <h3 className="mt-3 font-serif text-lg font-semibold">{issue.title}</h3>
          <p className="mt-2 text-xs text-white/50">{formatDate(issue.created_at)}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs ${statusTone[issue.status]}`}>
          {statusLabel[issue.status]}
        </span>
      </div>

      <div
        className={`mt-6 h-32 rounded-2xl bg-obsidian-800/70 ${coverClassName}`}
        style={coverStyle}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
        {issue.assets?.pdf_url && issue.status === 'ready' ? (
          <a
            href={issue.assets.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/20 px-3 py-2 transition hover:border-white/60"
          >
            Download PDF
          </a>
        ) : (
          <span className="rounded-full border border-white/10 px-3 py-2 text-white/40">PDF pending</span>
        )}
        <button
          type="button"
          onClick={handleToggle}
          disabled={busy || issue.status !== 'ready'}
          className="rounded-full border border-white/20 px-3 py-2 transition hover:border-white/60 disabled:opacity-40"
        >
          {issue.is_public ? 'Make private' : 'Make public'}
        </button>
        {issue.is_public && (
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-white/20 px-3 py-2 transition hover:border-white/60"
          >
            Copy public link
          </button>
        )}
      </div>
    </div>
  );
}
