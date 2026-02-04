import Link from 'next/link';
import { HeroInput } from '@/components/hero-input';

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="grain-overlay" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pb-24 pt-20">
        <nav className="flex items-center justify-between text-sm text-white/60">
          <span className="mono tracking-[0.2em] text-xs text-white/40">ISSUE</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="transition hover:text-white">Login</Link>
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
            <p className="mono text-xs uppercase tracking-[0.3em] text-white/40">Stop bookmarking. Start publishing.</p>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-gradient sm:text-5xl">
              Turn threads, articles, and posts into beautifully designed reading Issues.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              A premium, dark‑mode studio for devs who curate knowledge. One input. Two themes. A calm publishing ritual.
            </p>
            <HeroInput />
          </div>
          <div className="card-glass relative rounded-[32px] p-6">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span className="mono">ISSUE PREVIEW</span>
              <span>Journal Theme</span>
            </div>
            <div className="mt-6 rounded-3xl bg-paper-50 p-6 text-obsidian-950 shadow-inner">
              <p className="text-xs uppercase tracking-[0.3em] text-obsidian-700">Curated Issue</p>
              <h2 className="mt-4 font-serif text-2xl font-semibold">React 19 Deep Dive</h2>
              <p className="mt-4 text-sm text-obsidian-700">
                A stitched collection of the most important threads, releases, and essays, designed for a quiet weekend read.
              </p>
              <div className="mt-6 h-36 rounded-2xl border border-obsidian-800/10 bg-[linear-gradient(135deg,#f1ede5,#e8e1d5)]" />
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-white/40">
              <span>Crafting: 3 links · 12 min read</span>
              <span className="mono">A4</span>
            </div>
          </div>
        </section>

        <section className="mt-24 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: 'Zen Input',
              body: 'A single command bar. Paste links. We handle the rest.'
            },
            {
              title: 'The Stitcher',
              body: 'Bundle multiple URLs into one coherent Issue with a smart TOC.'
            },
            {
              title: 'Reading Shelf',
              body: 'A minimalist library of your published Issues, private by default.'
            }
          ].map((item) => (
            <div key={item.title} className="card-glass rounded-3xl p-6">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm text-white/60">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-24">
          <div className="flex items-center justify-between">
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
