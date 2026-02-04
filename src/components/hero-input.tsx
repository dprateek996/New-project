'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { THEMES } from '@/lib/themes';
import type { ThemeKey } from '@/lib/types';

const themeOptions: ThemeKey[] = ['journal', 'developer'];

export function HeroInput() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [theme, setTheme] = useState<ThemeKey>('journal');

  const handleSubmit = () => {
    if (value.trim()) {
      localStorage.setItem('issue:draft', value.trim());
    }
    localStorage.setItem('issue:theme', theme);
    router.push('/app');
  };

  return (
    <div className="mt-10">
      <div className="input-shell rounded-[28px] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
          <span className="mono text-[10px] uppercase tracking-[0.35em] text-white/40">Zen Input</span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/50">
            1–10 links
          </span>
        </div>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Paste a link to start your Issue"
          className="mt-4 min-h-[130px] w-full resize-none rounded-2xl bg-transparent px-1 text-base text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-accent-400/60"
        />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            {themeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.25em] transition ${
                  theme === option
                    ? 'bg-accent-400 text-obsidian-950'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {THEMES[option].label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-full bg-accent-400 px-6 py-3 text-sm font-semibold text-obsidian-950 transition hover:bg-accent-500"
          >
            Craft your Issue
          </button>
          <span className="text-xs text-white/45">A4 PDF + web preview</span>
        </div>
      </div>
    </div>
  );
}
