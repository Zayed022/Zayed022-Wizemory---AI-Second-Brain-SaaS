import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Remember Everything You Read — AI Tool | WizeMory',
  description: 'WizeMory uses spaced repetition and AI to make sure you remember everything you save. Turn reading into lasting knowledge.',
  alternates: { canonical: 'https://wizemory.com/tools/remember-what-you-read' },
}

export default function ToolPage() {
  return (
    <div className="min-h-screen bg-ink-50">
      <nav className="border-b border-ink-100 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-ink-900">Wize<span className="text-violet-500">Mory</span></Link>
        <Link href="/auth/sign-up" className="px-4 py-2 bg-ink-900 text-ink-50 rounded-lg text-sm font-medium">Try free →</Link>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="font-display text-5xl text-ink-900 mb-4">Finally remember everything you read</h1>
        <p className="text-lg text-ink-500 mb-10">The forgetting curve kills 90% of what you read within a week. WizeMory's spaced repetition system fixes that automatically.</p>
        <Link href="/auth/sign-up" className="inline-block px-10 py-4 bg-ink-900 text-ink-50 rounded-xl text-base font-medium hover:bg-ink-800 transition-colors">
          Start free — no card needed →
        </Link>
        <div className="mt-16 grid grid-cols-3 gap-4 text-left">
          {['AI summarisation on save','Spaced repetition review','AI Q&A from your notes'].map(f => (
            <div key={f} className="bg-white border border-ink-100 rounded-2xl p-4">
              <div className="text-sage-500 font-bold mb-1 text-lg">✓</div>
              <div className="text-sm font-medium text-ink-800">{f}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
