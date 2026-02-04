export type ThemeKey = 'journal' | 'developer';

export type IssueStatus = 'queued' | 'processing' | 'ready' | 'failed' | 'rejected';

export type IssueAsset = {
  pdf_url: string | null;
  cover_url: string | null;
  html_url: string | null;
} | null;

export type IssueRow = {
  id: string;
  title: string;
  theme: ThemeKey;
  status: IssueStatus;
  is_public: boolean;
  created_at: string;
  complexity_score: number | null;
  assets: IssueAsset;
};
