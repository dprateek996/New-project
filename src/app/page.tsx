import Link from 'next/link';
import { HeroInput } from '@/components/hero-input';

const proofCards = [
  {
    title: 'Issue 014',
    subtitle: 'Runtime Economics',
    meta: '6 links stitched | 19 min',
    tone: 'from-[#f4ecdd] to-[#e2d3bd] text-[#24180a]'
  },
  {
    title: 'Issue 038',
    subtitle: 'AI Reliability Notes',
    meta: '4 links stitched | 13 min',
    tone: 'from-[#121623] to-[#1e2437] text-[#e8e4dc]'
  },
  {
    title: 'Issue 052',
    subtitle: 'Designing With Constraints',
    meta: '5 links stitched | 16 min',
    tone: 'from-[#102024] to-[#193235] text-[#dce7e3]'
  }
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden px-6 pb-24 pt-12">
      <div className="grid-overlay" />
      <div className="grain-overlay" />
      <div className="orbit-overlay" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <nav className="reveal flex flex-wrap items-center justify-between gap-4" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-4">
            <span className="mono text-[10px] uppercase tracking-[0.35em] text-white/50">ISSUE</span>
            <span className="hidden text-xs text-white/50 sm:block">Curation studio for technical readers</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/70">
              Login
            </Link>
            <Link href="/app" className="btn-primary rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em]">
              Enter Studio
            </Link>
          </div>
        </nav>

        <section className="mt-16 grid items-start gap-10 lg:grid-cols-[1.12fr_0.88fr]">
          <div>
            <p className="reveal mono text-[10px] uppercase tracking-[0.35em] text-white/45" style={{ animationDelay: '110ms' }}>
              Stop bookmarking. Start publishing.
            </p>
            <h1 className="reveal mt-6 font-serif text-5xl leading-[0.95] text-gradient sm:text-6xl" style={{ animationDelay: '170ms' }}>
              Build private reading issues from the best links on the internet.
            </h1>
            <p className="reveal mt-6 max-w-2xl text-lg text-white/72" style={{ animationDelay: '240ms' }}>
              Paste threads and articles. Issue composes them into a focused artifact with typography, table of contents, source attribution, and share controls.
            </p>

            <div className="reveal" style={{ animationDelay: '320ms' }}>
              <HeroInput />
            </div>

            <div className="reveal mt-8 flex flex-wrap gap-3 text-xs text-white/58" style={{ animationDelay: '380ms' }}>
              <span className="badge rounded-full px-3 py-1">Complexity score credits</span>
              <span className="badge rounded-full px-3 py-1">Public links at MVP</span>
              <span className="badge rounded-full px-3 py-1">Journal + Developer themes</span>
            </div>
          </div>

          <div className="relative pt-3 lg:pt-9">
            <div className="card-glass reveal relative rounded-[30px] p-6" style={{ animationDelay: '210ms' }}>
              <div className="flex items-center justify-between text-xs text-white/58">
                <span className="mono text-[10px] tracking-[0.26em]">LIVE COMPOSITION</span>
                <span>Developer Theme</span>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-[#0e1320] p-5">
                <div className="flex items-center justify-between text-[11px] text-white/54">
                  <span>Issue_042</span>
                  <span className="text-[#7fd1af]">Crafting 68%</span>
                </div>
                <h2 className="mt-4 font-serif text-3xl leading-tight text-white">The Postgres Reliability Field Notes</h2>
                <div className="mt-4 space-y-2 text-xs text-white/58">
                  <p>01. Query planning in production</p>
                  <p>02. Four incident retrospectives</p>
                  <p>03. Indexing strategy decisions</p>
                </div>
                <div className="mt-6 h-[7px] overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#d8b282] via-[#f3cb99] to-[#86b49e]" />
                </div>
              </div>
            </div>

            <div className="panel-muted float-slow absolute -bottom-8 -left-7 hidden w-56 rounded-2xl p-4 md:block">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-white/45">
                <span>Notification</span>
                <span>Email</span>
              </div>
              <p className="mt-3 text-sm text-white/80">Issue 031 is ready for download and sharing.</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/55">
                <span className="metric-dot" />
                Delivered
              </div>
            </div>
          </div>
        </section>

        <section className="mt-24 grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'Zen Input',
              body: 'A single command surface, tuned for high intent workflows.'
            },
            {
              label: 'Stitch Engine',
              body: 'Multiple sources merged into one structured reading issue.'
            },
            {
              label: 'Shelf + Share',
              body: 'Private archive by default with clean public links when needed.'
            }
          ].map((item, index) => (
            <article
              key={item.label}
              className="card-glass reveal rounded-2xl p-5"
              style={{ animationDelay: `${420 + index * 80}ms` }}
            >
              <p className="mono text-[10px] uppercase tracking-[0.26em] text-white/45">{item.label}</p>
              <p className="mt-4 text-sm text-white/73">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-24">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-3xl">Preview the output style</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">Examples</span>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {proofCards.map((card, index) => (
              <article key={card.title} className="group card-glass reveal rounded-3xl p-4" style={{ animationDelay: `${560 + index * 70}ms` }}>
                <div className={`h-52 rounded-2xl bg-gradient-to-br p-5 transition duration-300 group-hover:scale-[1.01] ${card.tone}`}>
                  <p className="mono text-[10px] uppercase tracking-[0.24em] opacity-70">{card.title}</p>
                  <h3 className="mt-4 font-serif text-2xl leading-tight">{card.subtitle}</h3>
                  <p className="mt-6 text-xs opacity-70">{card.meta}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
