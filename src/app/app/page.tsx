import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { IssueStudio } from '@/components/issue-studio';
import type { IssueRow } from '@/lib/types';

export default async function AppPage() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    redirect('/login');
  }

  const { data: issues } = await supabase
    .from('issues')
    .select('id,title,theme,status,is_public,created_at,complexity_score,assets(pdf_url,cover_url,html_url)')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  const normalizedIssues = (issues ?? []).map((issue) => ({
    ...issue,
    assets: Array.isArray(issue.assets) ? issue.assets[0] ?? null : issue.assets ?? null
  }));

  return (
    <main className="relative px-6 py-12">
      <div className="grid-overlay" />
      <div className="grain-overlay" />
      <div className="orbit-overlay" />
      <div className="relative z-10">
        <IssueStudio userEmail={userData.user.email ?? ''} initialIssues={normalizedIssues as IssueRow[]} />
      </div>
    </main>
  );
}
