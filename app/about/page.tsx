import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About WizeMory — The AI Second Brain Built for Deep Learners',
  description: 'WizeMory was built because the best ideas disappear. We help researchers, founders, and curious people build a permanent, searchable knowledge base powered by AI.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ink-50">
      <nav className="border-b border-ink-100 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-ink-900">Wize<span className="text-violet-500">Mory</span></Link>
        <Link href="/auth/sign-up" className="px-4 py-2 bg-ink-900 text-ink-50 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors">Start free →</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="font-display text-5xl text-ink-900 mb-6">We built the app we needed ourselves</h1>

        <div className="space-y-6 text-ink-700 leading-relaxed">
          <p>Every week we saved dozens of articles, highlighted key passages, took notes — and forgot 90% of it within a month. Our "second brain" was a graveyard of unread bookmarks.</p>
          <p>WizeMory was built to fix that. Not by adding more places to dump information, but by making the information do work for you. The moment you save something, AI reads it, extracts what matters, and connects it to everything else you know.</p>
          <p>Ask "what do I know about decision-making?" and get an answer grounded in your own research — not the internet's. That's the difference.</p>

          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-6 my-8">
            <div className="font-display text-2xl text-violet-900 mb-2">Our mission</div>
            <p className="text-violet-800">To help a billion people build real, lasting knowledge — so that every hour they spend reading translates into permanent growth.</p>
          </div>

          <h2 className="font-display text-3xl text-ink-900">What makes WizeMory different</h2>
          <p>Most knowledge apps make you do the work. WizeMory does the work for you. Zero manual tagging. Zero folders to organise. Zero time spent filing things away.</p>
          <p>You save. We summarise, tag, connect, and surface. You ask questions. We answer from your own knowledge.</p>

          <h2 className="font-display text-3xl text-ink-900">Privacy first</h2>
          <p>Your knowledge base is completely private. We use AI to process your content, but we never sell your data or use it to train models. Your knowledge is yours.</p>

          <div className="pt-8">
            <Link href="/auth/sign-up" className="inline-block px-8 py-4 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 transition-colors">
              Start building your second brain →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
