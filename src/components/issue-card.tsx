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
  queued: 'border-white/18 text-white/60',
  processing: 'border-[#d8b282]/45 text-[#f0c996]',
  ready: 'border-[#86b49e]/45 text-[#9ed5b7]',
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

  const handleToggle = async () => {
    setBusy(true);
    await onShareToggle(issue.id, !issue.is_public);
    setBusy(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/share/${issue.id}`);
  };

  return (
    <article className="card-glass group rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:border-white/25">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.28em] text-white/44">{issue.theme}</p>
          <h3 className="mt-3 font-serif text-xl leading-tight">{issue.title}</h3>
          <p className="mt-2 text-xs text-white/52">{formatDate(issue.created_at)}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] ${statusTone[issue.status]}`}>
          {statusLabel[issue.status]}
        </span>
      </div>

      <div
        className="mt-5 h-36 rounded-2xl border border-white/10 bg-gradient-to-br from-[#12182a] to-[#1b2438] bg-cover bg-center"
        style={coverStyle}
      />

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
        {issue.assets?.pdf_url && issue.status === 'ready' ? (
          <a
            href={issue.assets.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost rounded-full px-3 py-2 text-white/80"
          >
            Download PDF
          </a>
        ) : (
          <span className="badge rounded-full px-3 py-2 text-white/45">PDF pending</span>
        )}

        <button
          type="button"
          onClick={handleToggle}
          disabled={busy || issue.status !== 'ready'}
          className="btn-ghost rounded-full px-3 py-2 text-white/80 disabled:opacity-45"
        >
          {issue.is_public ? 'Make private' : 'Make public'}
        </button>

        {issue.is_public && (
          <button
            type="button"
            onClick={handleCopy}
            className="btn-ghost rounded-full px-3 py-2 text-white/80"
          >
            Copy link
          </button>
        )}
      </div>
    </article>
  );
}
