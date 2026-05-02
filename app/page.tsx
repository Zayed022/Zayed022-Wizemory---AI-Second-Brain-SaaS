import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WizeMory — Your AI Second Brain | Never Forget Anything',
  description: 'Your knowledge, connected. WizeMory saves anything, summarises automatically with AI, and lets you ask questions from your own knowledge base.',
  keywords: ['second brain', 'knowledge management', 'AI notes app', 'personal knowledge base', 'Notion alternative', 'Readwise alternative'],
  openGraph: {
    title: 'WizeMory — Your AI Second Brain',
    description: 'Save anything. Ask anything. Never lose a good idea again.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://wizemory.com' },
}

const FEATURES = [
  { icon: '⚡', title: 'AI summaries in 20 seconds', desc: 'Paste any URL. Gemini AI reads the full article — not just the headline — and writes a 3-sentence summary with key insights and tags.' },
  { icon: '◈', title: 'Ask your knowledge base', desc: 'Type "What do I know about sleep?" and get answers from your own research. Not the internet. Your notes.' },
  { icon: '✦', title: 'AI connection discovery', desc: 'WizeMory finds non-obvious links between your saved items. A business article + a psychology note — connected automatically.' },
  { icon: '◇', title: 'Weekly intelligence digest', desc: 'Every Monday: a personalised email synthesising your week of learning with themes, patterns, and one actionable nudge.' },
  { icon: '↻', title: 'Never forget with spaced repetition', desc: 'The SM-2 algorithm (used by medical schools) resurfaces items at the optimal moment before you forget them.' },
  { icon: '▶', title: 'YouTube video summarisation', desc: 'Paste any YouTube URL. AI reads the full transcript and extracts the key ideas — no other note tool does this.' },
]

const TESTIMONIALS = [
  {
    name: 'Arjun Mehta', role: 'Product Manager, Bangalore', avatar: 'AM', stars: 5,
    text: 'I used to save 50 tabs a week and forget all of them. WizeMory turned that chaos into a knowledge base I actually use — and the weekly digest is something I genuinely look forward to every Monday.',
  },
  {
    name: 'Sarah Chen', role: 'PhD Researcher, Singapore', avatar: 'SC', stars: 5,
    text: 'The connection discovery is genuinely shocking. It linked a paper I saved in January to something I read last week — a bridge I would never have made myself. This is what a second brain should actually feel like.',
  },
  {
    name: 'Marcus Williams', role: 'Founder, Lagos', avatar: 'MW', stars: 5,
    text: 'I asked WizeMory "what do I know about pricing psychology?" and got a 4-point answer from 8 articles I had saved over 3 months. I use it before every strategic decision now.',
  },
  {
    name: 'Priya Sharma', role: 'Content Creator, Mumbai', avatar: 'PS', stars: 5,
    text: 'The AI writing assistant generates LinkedIn posts from my own research notes. It sounds like me because it is based on what I\'ve actually read. I use it every week.',
  },
]

const COMPARISON = [
  ['Auto-summarise on save',    true,  false, false, false],
  ['AI Q&A from your notes',    true,  false, false, false],
  ['YouTube summaries',         true,  false, false, false],
  ['Zero manual organisation',  true,  false, false, false],
  ['Spaced repetition',         true,  false, true,  false],
  ['Connection discovery',      true,  false, false, false],
  ['Weekly AI digest',          true,  false, true,  false],
  ['Knowledge graph',           true,  false, false, true ],
  ['Starts free',               true,  true,  false, true ],
]

const TRUST_SIGNALS = [
  { icon: '🔒', title: 'Private by default', desc: 'Your knowledge base is never shared or sold. We never train AI on your data.' },
  { icon: '📤', title: 'Full data export', desc: 'Export everything as Markdown, JSON, or a structured ZIP — always portable.' },
  { icon: '🇪🇺', title: 'GDPR compliant', desc: 'PII detection, consent logging, and right to erasure built into every account.' },
  { icon: '⚡', title: 'Zero lock-in', desc: 'Your data works in Obsidian, Notion, Logseq. WizeMory is a home, not a cage.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ink-50 overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl text-ink-900">Wize<span className="text-violet-500">Mory</span></Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-ink-500">
            <a href="#features" className="hover:text-ink-900 transition-colors">Features</a>
            <Link href="/pricing" className="hover:text-ink-900 transition-colors">Pricing</Link>
            <Link href="/demo"    className="hover:text-ink-900 transition-colors">Demo</Link>
            <a href="#testimonials" className="hover:text-ink-900 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <SignedIn>
              <Link href="/dashboard" className="px-4 py-2 bg-ink-900 text-ink-50 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors">
                Open app →
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-ink-500 hover:text-ink-900 px-3 py-2 transition-colors hidden sm:block">Sign in</button>
              </SignInButton>
              <Link href="/auth/sign-up" className="px-4 py-2 bg-ink-900 text-ink-50 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors">
                Start free →
              </Link>
            </SignedOut>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 relative">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-25 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-full text-violet-700 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse-soft" />
            Used by students, founders, researchers, and creators worldwide
          </div>
          <h1 className="font-display text-6xl md:text-7xl text-ink-900 leading-[0.95] mb-7">
            Your second brain,<br /><em className="gradient-text">actually useful.</em>
          </h1>
          <p className="text-xl text-ink-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Paste any URL, note, or video. In 20 seconds, WizeMory AI reads the full content, extracts key insights, and connects it to everything you've ever saved. Zero manual organisation. Your knowledge, connected.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link href="/auth/sign-up"
              className="w-full sm:w-auto px-8 py-4 bg-ink-900 text-ink-50 rounded-xl text-base font-medium hover:bg-ink-800 active:scale-[0.98] transition-all">
              Start free — no card needed
            </Link>
            <Link href="/demo"
              className="w-full sm:w-auto px-8 py-4 bg-white border border-ink-200 text-ink-700 rounded-xl text-base font-medium hover:border-ink-300 transition-all text-center">
              See live demo →
            </Link>
          </div>
          <p className="text-sm text-ink-400">50 items free forever · Pro from $12/month · Cancel anytime</p>
        </div>

        {/* Social proof bar */}
        <div className="max-w-3xl mx-auto mt-14 grid grid-cols-3 gap-6 text-center">
          {[
            ['10,000+', 'knowledge builders'],
            ['4.9 ★',   'average rating'],
            ['20s',     'average save time'],
          ].map(([n, l]) => (
            <div key={n}>
              <div className="font-display text-3xl text-ink-900">{n}</div>
              <div className="text-sm text-ink-400 mt-1">{l}</div>
            </div>
          ))}
        </div>

        {/* User type positioning */}
        <div className="max-w-2xl mx-auto mt-8 flex flex-wrap justify-center gap-2">
          {['🎓 Students', '🚀 Founders', '🔬 Researchers', '✍️ Content creators', '💼 Product managers', '📚 Lifelong learners'].map(u => (
            <span key={u} className="px-3 py-1.5 bg-white border border-ink-100 rounded-full text-sm text-ink-600 font-medium">{u}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl text-ink-900 mb-4">Your entire reading life, organised</h2>
            <p className="text-lg text-ink-500 max-w-xl mx-auto">Stop losing good ideas. Start building real knowledge.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-ink-50 rounded-2xl p-6 border border-transparent hover:border-ink-100 card-hover">
                <div className="text-2xl mb-3 text-violet-500">{f.icon}</div>
                <h3 className="font-medium text-ink-900 mb-2">{f.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-ink-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl text-ink-900 mb-4">How it works</h2>
            <p className="text-lg text-ink-500">Three steps. Zero effort. Permanent knowledge.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { n: '1', t: 'Save anything', d: 'Paste a URL, write a note, record voice, or upload a PDF. The browser extension saves any page in one click from Chrome, Brave, or Edge.' },
              { n: '2', t: 'AI processes it', d: 'Within 20 seconds, Gemini AI reads the full content, writes a summary, extracts 3 key insights, tags it, and connects it to everything else you\'ve saved.' },
              { n: '3', t: 'Ask and discover', d: 'Type any question. Get answers from your own knowledge base. Your knowledge graph grows richer every single day — automatically.' },
            ].map(s => (
              <div key={s.n}>
                <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-display text-xl mb-4">{s.n}</div>
                <h3 className="font-display text-2xl text-ink-900 mb-3">{s.t}</h3>
                <p className="text-ink-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl text-ink-900 mb-4">People who never forget anymore</h2>
            <p className="text-ink-500">Trusted by knowledge builders across 40+ countries.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-ink-50 rounded-2xl p-6 border border-ink-100">
                <div className="flex mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-ink-700 leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-ink-900">{t.name}</div>
                    <div className="text-xs text-ink-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 px-6 bg-ink-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-5xl text-ink-900 mb-4">Why not just use Notion?</h2>
            <p className="text-ink-500">Notion requires you to organise. WizeMory organises itself.</p>
          </div>
          <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-5 text-sm font-medium border-b border-ink-100">
              <div className="col-span-2 p-4 text-ink-400">Feature</div>
              <div className="p-4 text-center text-violet-700 bg-violet-50">WizeMory</div>
              <div className="p-4 text-center text-ink-400">Notion</div>
              <div className="p-4 text-center text-ink-400">Readwise</div>
            </div>
            {COMPARISON.map(([f, m, n, r]) => (
              <div key={f as string} className="grid grid-cols-5 text-sm border-b border-ink-50 last:border-0">
                <div className="col-span-2 p-4 text-ink-600">{f as string}</div>
                <div className="p-4 text-center bg-violet-50/50">
                  {m ? <span className="text-violet-600 font-bold">✓</span> : <span className="text-ink-300">✗</span>}
                </div>
                <div className="p-4 text-center">
                  {n ? <span className="text-ink-500 font-medium">✓</span> : <span className="text-ink-200">✗</span>}
                </div>
                <div className="p-4 text-center">
                  {r ? <span className="text-ink-500 font-medium">✓</span> : <span className="text-ink-200">✗</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl text-ink-900 mb-3">Built on trust</h2>
            <p className="text-ink-500">Your knowledge is yours — always.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {TRUST_SIGNALS.map(t => (
              <div key={t.title} className="text-center p-5 bg-ink-50 rounded-2xl">
                <div className="text-3xl mb-3">{t.icon}</div>
                <div className="font-medium text-sm text-ink-900 mb-1.5">{t.title}</div>
                <p className="text-xs text-ink-500 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-ink-900 relative overflow-hidden">
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="font-display text-5xl text-ink-50 mb-6">
            Your knowledge, connected.<br /><em className="text-violet-400">Are you?</em>
          </h2>
          <p className="text-ink-400 text-lg mb-10 leading-relaxed">
            Join 10,000+ people who never lose a good idea again. Start free in 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/sign-up"
              className="inline-block px-10 py-4 bg-violet-500 text-white rounded-xl text-base font-medium hover:bg-violet-400 active:scale-[0.98] transition-all">
              Start for free →
            </Link>
            <Link href="/demo"
              className="inline-block px-10 py-4 bg-white/10 text-white border border-white/20 rounded-xl text-base font-medium hover:bg-white/20 transition-all">
              See demo first
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-ink-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="font-display text-xl text-ink-300 mb-3">Wize<span className="text-violet-500">Mory</span></div>
              <p className="text-sm text-ink-600 leading-relaxed">Your AI second brain. Your knowledge, connected. Save anything, ask anything.</p>
            </div>
            {[
              { h: 'Product',  links: [['Features','/#features'],['Pricing','/pricing'],['Demo','/demo'],['Changelog','/changelog']] },
              { h: 'Company',  links: [['About','/about'],['Blog','/blog'],['Privacy','/privacy'],['Terms','/terms']] },
              { h: 'Support',  links: [['Help','mailto:hello@wizemory.com'],['Contact','mailto:hello@wizemory.com'],['Twitter','https://twitter.com/wizemory'],['Acquire.com','https://acquire.com']] },
            ].map(col => (
              <div key={col.h}>
                <div className="text-xs text-ink-500 font-medium uppercase tracking-wide mb-3">{col.h}</div>
                <div className="space-y-2">
                  {col.links.map(([l, h]) => (
                    <a key={l} href={h} className="block text-sm text-ink-600 hover:text-ink-300 transition-colors">{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-ink-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-ink-600">© 2025 WizeMory. All rights reserved.</div>
            <div className="text-xs text-ink-600">Made with ✦ for knowledge builders worldwide</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
