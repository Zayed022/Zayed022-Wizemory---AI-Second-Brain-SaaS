import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'WizeMory for Teams — Shared AI Knowledge Base | WizeMory',
  description: 'Give your whole team a shared second brain. Onboard faster, search internal docs with AI, and never lose institutional knowledge again.',
}

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-ink-50">
      <nav className="border-b border-ink-100 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-ink-900">Wize<span className="text-violet-500">Mory</span></Link>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm text-ink-500 hover:text-ink-900">Pricing</Link>
          <Link href="mailto:sales@wizemory.com" className="px-4 py-2 bg-ink-900 text-ink-50 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors">Talk to sales →</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 bg-sage-50 text-sage-700 text-xs font-medium rounded-full mb-4 border border-sage-200">For teams</div>
          <h1 className="font-display text-5xl text-ink-900 mb-4">Your team's shared second brain</h1>
          <p className="text-xl text-ink-500 max-w-2xl mx-auto mb-8">
            New hires onboard in days, not months. No more "where did we document that?" moments. Every article, doc, and meeting note — summarised, connected, searchable.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="mailto:sales@wizemory.com" className="px-8 py-3.5 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 transition-colors">Talk to sales</Link>
            <Link href="/pricing" className="px-8 py-3.5 bg-white border border-ink-200 text-ink-700 rounded-xl text-sm font-medium hover:border-ink-300 transition-colors">See team pricing →</Link>
          </div>
        </div>

        {/* Use cases */}
        <div className="grid grid-cols-2 gap-4 mb-16">
          {[
            { icon: '🚀', title: 'Onboarding docs summariser', desc: 'New hire? Paste your 50-page handbook. WizeMory summarises every document and answers questions about your company — in their first week.' },
            { icon: '🔍', title: 'Search internal company docs', desc: 'Ask "What is our refund policy?" and get the answer from your own docs. No more digging through Notion, Google Drive, or Confluence.' },
            { icon: '🧠', title: 'Team memory assistant', desc: 'Never lose institutional knowledge when someone leaves. Every decision, rationale, and lesson is captured and searchable.' },
            { icon: '📊', title: 'Shared knowledge base', desc: 'Sales, product, and engineering all read from the same source of truth. Industry articles, competitor research, customer insights — all organised.' },
          ].map(u => (
            <div key={u.title} className="bg-white border border-ink-100 rounded-2xl p-6">
              <div className="text-3xl mb-3">{u.icon}</div>
              <h3 className="font-medium text-ink-900 mb-2">{u.title}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing callout */}
        <div className="bg-white border border-ink-100 rounded-2xl p-8 mb-8 flex items-center justify-between">
          <div>
            <div className="font-display text-4xl text-ink-900 mb-1">$49 <span className="text-sm text-ink-400 font-sans">/user/month</span></div>
            <p className="text-ink-500 text-sm">10-user team = $490/month. One bad hire costs 10× that.</p>
          </div>
          <Link href="mailto:sales@wizemory.com" className="px-6 py-3 bg-sage-600 text-white rounded-xl text-sm font-medium hover:bg-sage-700 transition-colors whitespace-nowrap">
            Start team trial →
          </Link>
        </div>

        <div className="bg-ink-900 rounded-2xl p-8 text-center">
          <h2 className="font-display text-3xl text-ink-50 mb-3">The cost of forgetting is higher than the cost of WizeMory</h2>
          <p className="text-ink-400 mb-6">Every hour your team spends searching for information that already exists is revenue lost. WizeMory pays for itself in week one.</p>
          <Link href="mailto:sales@wizemory.com" className="inline-block px-8 py-3 bg-white text-ink-900 rounded-xl text-sm font-medium hover:bg-ink-100 transition-colors">
            Schedule a demo →
          </Link>
        </div>
      </main>
    </div>
  )
}
