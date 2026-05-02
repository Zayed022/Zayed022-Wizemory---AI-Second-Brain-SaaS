import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Summarize YouTube Videos with AI — Free | WizeMory',
  description: 'Paste any YouTube URL and get an instant AI-generated summary, key insights, and tags. Save it to your knowledge base. Free to try.',
  alternates: { canonical: 'https://wizemory.com/tools/summarize-youtube-video' },
}

export default function SummarizeYouTubePage() {
  return (
    <div className="min-h-screen bg-ink-50">
      <nav className="border-b border-ink-100 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-ink-900">Wize<span className="text-violet-500">Mory</span></Link>
        <Link href="/auth/sign-up" className="px-4 py-2 bg-ink-900 text-ink-50 rounded-lg text-sm font-medium">Try free →</Link>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full mb-4 border border-red-100">▶ YouTube AI Summariser</div>
          <h1 className="font-display text-5xl text-ink-900 mb-4">Summarize any YouTube video instantly</h1>
          <p className="text-lg text-ink-500 max-w-xl mx-auto">Paste a YouTube URL. WizeMory AI reads the full transcript and gives you a crisp summary, key insights, and tags — in under 20 seconds.</p>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-8 mb-8 text-center">
          <div className="text-ink-400 text-sm mb-6">Paste any YouTube URL below to try it</div>
          <div className="flex gap-2 max-w-lg mx-auto mb-4">
            <input type="url" placeholder="https://youtube.com/watch?v=..." className="flex-1 px-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-violet-400" />
            <Link href="/auth/sign-up" className="px-5 py-3 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors whitespace-nowrap">Summarise →</Link>
          </div>
          <p className="text-xs text-ink-400">Sign up free to summarise videos. No credit card needed.</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { icon: '⚡', title: 'Instant results', desc: 'Full transcript analysis in under 20 seconds' },
            { icon: '🧠', title: 'Real insights', desc: 'Not just a summary — actionable takeaways extracted' },
            { icon: '🔗', title: 'Saved forever', desc: 'Connects to your entire knowledge base automatically' },
          ].map(f => (
            <div key={f.title} className="bg-white border border-ink-100 rounded-2xl p-5 text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-medium text-sm text-ink-900 mb-1">{f.title}</div>
              <div className="text-xs text-ink-500">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="bg-ink-900 rounded-2xl p-8 text-center">
          <h2 className="font-display text-3xl text-ink-50 mb-3">Never waste a YouTube video again</h2>
          <p className="text-ink-400 mb-6">Join thousands of learners who turn videos into lasting knowledge.</p>
          <Link href="/auth/sign-up" className="inline-block px-8 py-3 bg-violet-500 text-white rounded-xl text-sm font-medium hover:bg-violet-400 transition-colors">Start free — no card needed</Link>
        </div>
      </main>
    </div>
  )
}
