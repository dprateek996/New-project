'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function HeroInput() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      localStorage.setItem('issue:draft', value.trim());
    }
    router.push('/app');
  };

  return (
    <div className="mt-10 flex w-full flex-col gap-4">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Paste a link to start your Issue"
        className="input-shell min-h-[120px] w-full resize-none rounded-3xl px-6 py-5 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent-400"
      />
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-full bg-accent-400 px-6 py-3 text-sm font-semibold text-obsidian-950 transition hover:bg-accent-500"
        >
          Craft your Issue
        </button>
        <span className="text-sm text-white/50">1–10 links · Journal or Developer theme</span>
      </div>
    </div>
  );
}
