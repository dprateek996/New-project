import Link from 'next/link';
import { HeroInput } from '@/components/hero-input';

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="grid-overlay" />
      <div className="grain-overlay" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-24 pt-16">
        <nav className="flex flex-wrap items-center justify-between gap-4 text-sm text-white/60">
          <div className="flex items-center gap-4">
            <span className="mono text-xs tracking-[0.4em] text-white/40">ISSUE</span>
            <span className="text-xs text-white/40">Premium Issue Generator</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs uppercase tracking-[0.2em] transition hover:text-white">
              Login
            </Link>
            <Link
              href="/app"
              className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:border-white/60"
            >
              Enter Studio
            </Link>
          </div>
        </nav>

        <section className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mono text-xs uppercase tracking-[0.35em] text-white/40 reveal" style={{ animationDelay: '40ms' }}>
              Stop bookmarking. Start publishing.
            </p>
            <h1
              className="mt-6 font-serif text-4xl font-semibold leading-tight text-gradient sm:text-5xl reveal"
              style={{ animationDelay: '120ms' }}
            >
              Turn threads, articles, and posts into a serene reading Issue.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70 reveal" style={{ animationDelay: '180ms' }}>
              Issue turns noisy links into a calm, designed artifact. One paste. Two themes. A quiet publishing ritual built
              for developers who curate.
            </p>
            <div className="reveal" style={{ animationDelay: '260ms' }}>
              <HeroInput />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-white/45 reveal" style={{ animationDelay: '320ms' }}>
              <span className="rounded-full border border-white/10 px-3 py-1">20 credits/day</span>
              <span className="rounded-full border border-white/10 px-3 py-1">A4 PDF · TOC · Cover</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Private by default</span>
            </div>
          </div>

          <div className="relative">
            <div className="card-glass relative rounded-[32px] p-6">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span className="mono">ISSUE PREVIEW</span>
                <span>Journal Theme</span>
              </div>
              <div className="mt-6 rounded-3xl bg-paper-50 p-6 text-obsidian-950 shadow-inner">
                <p className="text-xs uppercase tracking-[0.3em] text-obsidian-700">Curated Issue</p>
                <h2 className="mt-4 font-serif text-2xl font-semibold">The Craft of Debugging</h2>
                <p className="mt-4 text-sm text-obsidian-700">
                  A stitched collection of the most important threads, releases, and essays, designed for a quiet weekend read.
                </p>
                <div className="mt-6 h-36 rounded-2xl border border-obsidian-800/10 bg-[linear-gradient(135deg,#f1ede5,#e8e1d5)]" />
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-white/40">
                <span>Crafting: 4 links · 14 min read</span>
                <span className="mono">A4</span>
              </div>
            </div>
            <div className="card-glass floaty absolute -bottom-8 -left-6 hidden w-56 rounded-3xl p-4 text-xs text-white/70 md:block">
              <p className="mono text-[10px] uppercase tracking-[0.3em] text-white/40">Notification</p>
              <p className="mt-3">Your Issue “Infra Notes” is ready.</p>
              <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/50">
                <span className="h-1 w-6 rounded-full bg-accent-400/80" />
                Delivered
              </div>
            </div>
          </div>
        </section>

        <section className="mt-24 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: 'Zen Input',
              body: 'A single, quiet input. Paste links and let Issue stitch the story.'
            },
            {
              title: 'The Stitcher',
              body: 'Combine articles and threads into one coherent Issue with a crisp TOC.'
            },
            {
              title: 'Reading Shelf',
              body: 'A minimalist library of your published Issues, private by default.'
            }
          ].map((item, index) => (
            <div
              key={item.title}
              className="card-glass rounded-3xl p-6 reveal"
              style={{ animationDelay: `${360 + index * 80}ms` }}
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm text-white/60">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-24">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-semibold">See what an Issue looks like</h2>
            <span className="text-xs text-white/40">Examples below the fold</span>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {['Systems Notes', 'AI Infrastructure', 'Design Systems'].map((title) => (
              <div key={title} className="card-glass rounded-3xl p-6">
                <p className="mono text-xs text-white/40">PUBLIC ISSUE</p>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm text-white/60">Curated links, stitched into a calm, readable artifact.</p>
                <div className="mt-6 h-28 rounded-2xl bg-obsidian-800/60" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
