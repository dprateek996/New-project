import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseRouteClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: issue } = await supabase
    .from('issues')
    .select('id,title,theme,status,is_public,created_at,complexity_score,assets(pdf_url,cover_url,html_url)')
    .eq('id', params.id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (!issue) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const assets = Array.isArray(issue.assets) ? issue.assets[0] : issue.assets;
  if (!assets) {
    return NextResponse.json({ ...issue, assets: null });
  }

  const admin = createSupabaseAdminClient();
  const signedAssets = { ...assets };

  if (assets.pdf_url) {
    const { data } = await admin.storage.from('issues').createSignedUrl(assets.pdf_url, 3600);
    signedAssets.pdf_url = data?.signedUrl ?? null;
  }

  if (assets.cover_url) {
    const { data } = await admin.storage.from('issues').createSignedUrl(assets.cover_url, 3600);
    signedAssets.cover_url = data?.signedUrl ?? null;
  }

  if (assets.html_url) {
    const { data } = await admin.storage.from('issues').createSignedUrl(assets.html_url, 3600);
    signedAssets.html_url = data?.signedUrl ?? null;
  }

  return NextResponse.json({ ...issue, assets: signedAssets });
}
