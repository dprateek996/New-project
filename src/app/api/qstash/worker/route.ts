import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';

export async function POST(request: Request) {
  const env = getServerEnv();
  const secret = request.headers.get('x-worker-secret');

  if (env.WORKER_SHARED_SECRET && secret !== env.WORKER_SHARED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.text();
  if (!env.QSTASH_WORKER_URL) {
    return NextResponse.json({ ok: true, message: 'No worker URL configured.' });
  }

  const response = await fetch(env.QSTASH_WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-worker-secret': env.WORKER_SHARED_SECRET ?? ''
    },
    body: payload
  });

  return NextResponse.json({ ok: response.ok });
}
