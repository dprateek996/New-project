import { notFound } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export default async function SharePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseAdminClient();
  const { data: issue } = await supabase
    .from('issues')
    .select('id,title,theme,is_public,created_at')
    .eq('id', params.id)
    .eq('is_public', true)
    .maybeSingle();

  if (!issue) {
    notFound();
  }

  const { data: assets } = await supabase
    .from('assets')
    .select('pdf_url,html_url')
    .eq('issue_id', issue.id)
    .maybeSingle();

  let htmlSignedUrl: string | null = null;
  let pdfSignedUrl: string | null = null;

  if (assets?.html_url) {
    const { data } = await supabase.storage.from('issues').createSignedUrl(assets.html_url, 3600);
    htmlSignedUrl = data?.signedUrl ?? null;
  }

  if (assets?.pdf_url) {
    const { data } = await supabase.storage.from('issues').createSignedUrl(assets.pdf_url, 3600);
    pdfSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <main className="relative min-h-screen bg-obsidian-950 px-6 py-12">
      <div className="grain-overlay" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="card-glass rounded-3xl p-6">
          <p className="mono text-xs uppercase tracking-[0.3em] text-white/40">PUBLIC ISSUE</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold">{issue.title}</h1>
          <p className="mt-2 text-sm text-white/60">{issue.theme} theme · Published Issue</p>
          {pdfSignedUrl && (
            <a
              href={pdfSignedUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white/60"
            >
              Download PDF
            </a>
          )}
        </div>

        <div className="mt-10 rounded-3xl bg-paper-50 p-2 text-obsidian-950">
          {htmlSignedUrl ? (
            <iframe
              src={htmlSignedUrl}
              className="h-[720px] w-full rounded-2xl border border-obsidian-800/10"
              title="Issue preview"
            />
          ) : (
            <p className="p-6 text-sm text-obsidian-700">This Issue is still rendering its public preview.</p>
          )}
        </div>
      </div>
    </main>
  );
}
