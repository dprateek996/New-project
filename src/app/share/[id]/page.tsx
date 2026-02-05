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
    <main className="relative min-h-screen px-6 py-12">
      <div className="grid-overlay" />
      <div className="grain-overlay" />
      <div className="orbit-overlay" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <section className="card-glass rounded-3xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.3em] text-white/46">Public Issue</p>
              <h1 className="mt-3 font-serif text-4xl leading-tight">{issue.title}</h1>
              <p className="mt-2 text-sm text-white/62">{issue.theme} theme | Shared reading page</p>
            </div>

            {pdfSignedUrl && (
              <a
                href={pdfSignedUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary rounded-full px-5 py-2 text-xs uppercase tracking-[0.2em]"
              >
                Download PDF
              </a>
            )}
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/14 bg-[#f6efe4] p-2 shadow-2xl">
          {htmlSignedUrl ? (
            <iframe
              src={htmlSignedUrl}
              className="h-[760px] w-full rounded-2xl border border-black/10"
              title="Issue preview"
            />
          ) : (
            <p className="p-8 text-sm text-[#3a2f22]">This Issue is still rendering its public preview.</p>
          )}
        </section>
      </div>
    </main>
  );
}
