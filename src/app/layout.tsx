import type { Metadata } from 'next';
import { Fraunces, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { PostHogClientProvider } from '@/components/posthog-provider';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif'
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans'
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: 'Issue — Stop bookmarking. Start publishing.',
  description: 'Turn threads, articles, and posts into beautifully designed reading issues.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${fraunces.variable} ${manrope.variable} ${jetbrains.variable} h-full bg-obsidian-950 text-white`}>
        <PostHogClientProvider>
          {children}
        </PostHogClientProvider>
      </body>
    </html>
  );
}
