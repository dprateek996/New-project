import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Client } from '@upstash/qstash';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { detectSourceType, normalizeUrls } from '@/lib/urls';
import { getServerEnv } from '@/lib/env';
import { getNextUtcResetAt } from '@/lib/credits';

const schema = z.object({
  urls: z.array(z.string().min(1)).min(1).max(10),
  theme: z.enum(['journal', 'developer']),
  title: z.string().max(120).optional()
});

export async function POST(request: Request) {
  const supabase = createSupabaseRouteClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: z.infer<typeof schema>;
  try {
    payload = schema.parse(await request.json());
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const cleanedUrls = normalizeUrls(payload.urls);
  if (!cleanedUrls.length) {
    return NextResponse.json({ error: 'No valid URLs provided.' }, { status: 400 });
  }
  if (cleanedUrls.length > 10) {
    return NextResponse.json({ error: 'Limit is 10 URLs per Issue.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: existingUser } = await admin
    .from('users')
    .select('id,credits_reset_at')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (!existingUser) {
    await admin.from('users').insert({
      id: auth.user.id,
      email: auth.user.email ?? null,
      daily_credits: 20,
      credits_reset_at: getNextUtcResetAt().toISOString()
    });
  } else if (!existingUser.credits_reset_at) {
    await admin
      .from('users')
      .update({ credits_reset_at: getNextUtcResetAt().toISOString() })
      .eq('id', auth.user.id);
  }

  const title = payload.title?.trim() || deriveTitle(cleanedUrls[0]);

  const { data: issue, error: issueError } = await admin
    .from('issues')
    .insert({
      user_id: auth.user.id,
      title,
      theme: payload.theme,
      status: 'queued',
      is_public: false
    })
    .select('id,title,theme,status,is_public,created_at,complexity_score')
    .single();

  if (issueError || !issue) {
    return NextResponse.json({ error: 'Unable to create Issue.' }, { status: 500 });
  }

  await admin.from('events').insert({
    user_id: auth.user.id,
    issue_id: issue.id,
    type: 'issue_created',
    metadata: {
      link_count: cleanedUrls.length,
      theme: payload.theme
    }
  });

  const linkRows = cleanedUrls.map((url, index) => ({
    issue_id: issue.id,
    url,
    canonical_url: url,
    source_type: detectSourceType(url),
    order_index: index
  }));

  const { error: linksError } = await admin.from('links').insert(linkRows);
  if (linksError) {
    return NextResponse.json({ error: 'Unable to create Issue links.' }, { status: 500 });
  }

  const env = getServerEnv();
  const qstashUrl = env.QSTASH_WORKER_URL;

  if (!env.QSTASH_TOKEN || !qstashUrl) {
    await admin.from('issues').update({ status: 'failed' }).eq('id', issue.id);
    return NextResponse.json({ error: 'Worker not configured.' }, { status: 500 });
  }

  const client = new Client({ token: env.QSTASH_TOKEN });
  await client.publishJSON({
    url: qstashUrl,
    body: { issueId: issue.id },
    headers: {
      'x-worker-secret': env.WORKER_SHARED_SECRET ?? ''
    }
  });

  return NextResponse.json({
    ...issue,
    assets: null
  });
}

function deriveTitle(url: string) {
  try {
    const parsed = new URL(url);
    return `Issue — ${parsed.hostname.replace('www.', '')}`;
  } catch {
    return 'New Issue';
  }
}
