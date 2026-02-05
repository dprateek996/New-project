import type { Metadata } from 'next';
import './globals.css';
import { PostHogClientProvider } from '@/components/posthog-provider';

export const metadata: Metadata = {
  title: 'Issue | Stop bookmarking. Start publishing.',
  description: 'Turn threads, articles, and posts into premium reading issues.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">
        <PostHogClientProvider>{children}</PostHogClientProvider>
      </body>
    </html>
  );
}
