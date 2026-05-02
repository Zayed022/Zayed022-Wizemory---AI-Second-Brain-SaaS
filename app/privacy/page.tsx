import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ink-50">
      <nav className="border-b border-ink-100 bg-white px-6 py-4">
        <Link href="/" className="font-display text-xl text-ink-900">
          Wize<span className="text-violet-500">Mory</span>
        </Link>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16 prose-wizemory">
        <h1 className="font-display text-4xl text-ink-900 mb-2">Privacy Policy</h1>
        <p className="text-ink-400 text-sm mb-10">Last updated: January 2025</p>

        <div className="space-y-8 text-ink-700">
          <section>
            <h2 className="font-display text-2xl text-ink-900 mb-3">What we collect</h2>
            <p className="text-ink-600 leading-relaxed">We collect your email address and name when you sign up. We store the content you save to WizeMory (articles, notes, voice memos, PDFs) in order to provide the service. We use Clerk for authentication and Stripe for payments — their privacy policies apply to data they handle.</p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink-900 mb-3">How we use your data</h2>
            <p className="text-ink-600 leading-relaxed">Your saved content is sent to Anthropic's Claude API to generate summaries, tags, and connections. Anthropic's API privacy policy applies. We do not sell your data to third parties. We use aggregate, anonymised usage data to improve the product.</p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink-900 mb-3">Your rights</h2>
            <p className="text-ink-600 leading-relaxed">You can export all your data at any time from Settings. You can delete your account and all associated data from Settings. For any privacy requests, email <a href="mailto:privacy@wizemory.com" className="text-violet-600">privacy@wizemory.com</a>.</p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink-900 mb-3">Security</h2>
            <p className="text-ink-600 leading-relaxed">All data is encrypted in transit (HTTPS) and at rest. Your knowledge base is private by default — only items you explicitly share are accessible publicly.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
