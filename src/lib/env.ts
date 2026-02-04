import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional()
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_WORKER_URL: z.string().url().optional(),
  WORKER_SHARED_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional()
});

export function getClientEnv() {
  return clientSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST
  });
}

export function getServerEnv() {
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,
    QSTASH_WORKER_URL: process.env.QSTASH_WORKER_URL,
    WORKER_SHARED_SECRET: process.env.WORKER_SHARED_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY
  });
}
