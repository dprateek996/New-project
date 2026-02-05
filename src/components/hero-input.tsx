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
      <div className="input-shell rounded-[30px] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mono text-[10px] uppercase tracking-[0.28em] text-white/48">Paste links to compose</p>
            <p className="mt-1 text-xs text-white/52">Input supports one URL per line</p>
          </div>
          <span className="badge rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/55">1-10 links</span>
        </div>

        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://x.com/...\nhttps://medium.com/..."
          className="mt-4 min-h-[136px] w-full resize-none rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white placeholder:text-white/34 focus:border-[#d8b282]/70 focus:outline-none"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1">
            {themeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] transition ${
                  theme === option
                    ? 'bg-[#f0c996] text-[#1a1208]'
                    : 'text-white/58 hover:text-white'
                }`}
              >
                {THEMES[option].label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary rounded-full px-6 py-3 text-sm font-semibold"
          >
            Craft your Issue
          </button>

          <span className="text-xs text-white/48">A4 PDF + web preview + share toggle</span>
        </div>
      </div>
    </div>
  );
}
