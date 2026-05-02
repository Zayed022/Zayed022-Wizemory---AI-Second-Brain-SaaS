import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Changelog — WizeMory',
  description: 'See what\'s new in WizeMory. We ship weekly.',
}

const CHANGES = [
  {
    version: '2.0',
    date: 'April 2025',
    tag: 'Major release',
    items: [
      'YouTube video summarisation — paste any YouTube URL to extract key insights',
      'Collections — organise your knowledge into themed folders',
      'Highlights — save and search passages from your articles',
      'Spaced repetition review queue — resurfaces items on the optimal schedule',
      'Referral programme — earn a free month for every 3 friends you refer',
      'Streak tracking and achievement badges',
      'Weekly streak reminder emails',
      'PWA — install WizeMory on your phone like a native app',
    ],
  },
  {
    version: '1.5',
    date: 'March 2025',
    tag: 'AI upgrade',
    items: [
      'Switched AI to Google Gemini 2.5 Flash — 3× faster processing',
      'Groq Llama 3.3 70B as fallback for zero downtime',
      'Improved summarisation accuracy — better titles, more specific insights',
      'AI connection discovery — finds non-obvious links between your saved items',
      'Weekly digest emails every Monday morning',
      'Public share cards — share any item as a beautiful public page',
      'OG images generated automatically for every shared card',
    ],
  },
  {
    version: '1.0',
    date: 'February 2025',
    tag: 'Launch',
    items: [
      'AI summarisation for articles, notes, PDFs, and voice memos',
      'Full-text search across your entire knowledge base',
      'AI Q&A — ask questions about your own knowledge',
      'Browser extension for Chrome, Brave, and Edge',
      'Clerk authentication with Google and email',
      'Stripe subscriptions — Free, Pro ($12/mo), Team ($29/user/mo)',
      'Data export as JSON or Markdown',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-ink-50">
      <nav className="border-b border-ink-100 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-ink-900">Wize<span className="text-violet-500">Mory</span></Link>
        <Link href="/auth/sign-up" className="px-4 py-2 bg-ink-900 text-ink-50 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors">Start free →</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="font-display text-5xl text-ink-900 mb-3">Changelog</h1>
          <p className="text-ink-500">We ship improvements every week. Here's what's new.</p>
        </div>

        <div className="space-y-12">
          {CHANGES.map(release => (
            <div key={release.version} className="relative pl-8 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-ink-100">
              <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-violet-400" />
              <div className="flex items-center gap-3 mb-4">
                <span className="font-display text-2xl text-ink-900">v{release.version}</span>
                <span className="text-xs font-medium px-2.5 py-1 bg-violet-50 text-violet-700 rounded-full">{release.tag}</span>
                <span className="text-sm text-ink-400">{release.date}</span>
              </div>
              <ul className="space-y-2">
                {release.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ink-600">
                    <span className="text-sage-500 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 p-6 bg-violet-50 border border-violet-100 rounded-2xl">
          <div className="font-medium text-violet-900 mb-1">Want to suggest a feature?</div>
          <p className="text-sm text-violet-700 mb-3">We read every message and build what our users actually need.</p>
          <a href="mailto:feedback@wizemory.com" className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
            feedback@wizemory.com →
          </a>
        </div>
      </main>
    </div>
  )
}
