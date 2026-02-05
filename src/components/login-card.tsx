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
    <div className="card-glass w-full max-w-md rounded-[28px] p-7">
      <p className="mono text-[10px] uppercase tracking-[0.3em] text-white/46">Issue Studio</p>
      <h1 className="mt-3 font-serif text-3xl">Enter the studio</h1>
      <p className="mt-2 text-sm text-white/64">Sign in to craft, store, and share premium reading issues.</p>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={handleGithub}
          className="btn-ghost w-full rounded-full px-4 py-3 text-sm font-semibold text-white/88"
        >
          Continue with GitHub
        </button>

        <div className="text-center text-[10px] uppercase tracking-[0.25em] text-white/35">or</div>

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@studio.dev"
          className="input-shell w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
        />

        <button
          type="button"
          onClick={handleEmail}
          className="btn-primary w-full rounded-full px-4 py-3 text-sm font-semibold"
        >
          Send magic link
        </button>
      </div>

      {status && <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/72">{status}</p>}
    </div>
  );
}
