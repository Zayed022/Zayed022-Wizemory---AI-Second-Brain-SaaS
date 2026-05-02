import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ink-50">
      <nav className="border-b border-ink-100 bg-white px-6 py-4">
        <Link href="/" className="font-display text-xl text-ink-900">
          Wize<span className="text-violet-500">Mory</span>
        </Link>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl text-ink-900 mb-2">Terms of Service</h1>
        <p className="text-ink-400 text-sm mb-10">Last updated: January 2025</p>

        <div className="space-y-8 text-ink-700">
          <section>
            <h2 className="font-display text-2xl text-ink-900 mb-3">Using WizeMory</h2>
            <p className="text-ink-600 leading-relaxed">By using WizeMory, you agree to use the service for lawful purposes only. You are responsible for the content you save. Do not save content that infringes intellectual property rights or is illegal in your jurisdiction.</p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink-900 mb-3">Your content</h2>
            <p className="text-ink-600 leading-relaxed">You own all content you save to WizeMory. By saving content, you grant us a limited licence to process it to provide the service (summaries, search, etc.). We do not claim ownership of your content.</p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink-900 mb-3">Subscriptions and billing</h2>
            <p className="text-ink-600 leading-relaxed">Pro and Team subscriptions are billed monthly or yearly via Stripe. You can cancel at any time and will retain access until the end of your billing period. Refunds are available within 14 days of initial purchase.</p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink-900 mb-3">Limitation of liability</h2>
            <p className="text-ink-600 leading-relaxed">WizeMory is provided "as is". We are not liable for data loss, though we take extensive precautions to prevent it. We recommend keeping your own backups of critical information.</p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink-900 mb-3">Contact</h2>
            <p className="text-ink-600 leading-relaxed">
              Questions? Email <a href="mailto:hello@wizemory.com" className="text-violet-600">hello@wizemory.com</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
