'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function LoginCard() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const handleEmail = async () => {
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus('Magic link sent. Check your inbox.');
  };

  return (
    <div className="card-glass w-full max-w-md rounded-3xl p-8">
      <h1 className="font-serif text-2xl font-semibold">Enter the Studio</h1>
      <p className="mt-2 text-sm text-white/60">Sign in to craft, store, and share your Issues.</p>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGithub}
          className="rounded-full border border-white/20 px-4 py-3 text-sm font-semibold transition hover:border-white/60"
        >
          Continue with GitHub
        </button>
        <div className="text-xs uppercase tracking-[0.3em] text-white/30">or</div>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@studio.dev"
          className="input-shell rounded-2xl px-4 py-3 text-sm"
        />
        <button
          type="button"
          onClick={handleEmail}
          className="rounded-full bg-accent-400 px-4 py-3 text-sm font-semibold text-obsidian-950 transition hover:bg-accent-500"
        >
          Email magic link
        </button>
      </div>
      {status && <p className="mt-4 text-xs text-white/60">{status}</p>}
    </div>
  );
}
