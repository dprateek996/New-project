import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getClientEnv } from '@/lib/env';

export function createSupabaseServerClient() {
  const env = getClientEnv();
  const cookieStore = cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set() {
        // No-op in server components
      },
      remove() {
        // No-op in server components
      }
    }
  });
}
