'use client'
import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const PLANS = [
  {
    id: 'free', name: 'Free', price: { monthly: 0, yearly: 0 }, color: '#928c82',
    description: 'Try WizeMory and build your knowledge habit',
    cta: 'Start free', href: '/auth/sign-up',
    features: ['50 items', '10 AI queries/month', 'AI summarisation', 'Browser extension', 'Full-text search', 'Collections & highlights'],
  },
  {
    id: 'pro', name: 'Pro', price: { monthly: 12, yearly: 99 }, color: '#7340f5', popular: true,
    description: 'For serious learners who want to remember everything',
    cta: 'Start Pro',
    features: ['Unlimited items', 'Unlimited AI queries', 'Weekly digest email', 'Spaced repetition', 'YouTube summaries', 'AI connections', 'Knowledge graph', 'Writing assistant', 'Streaks & badges', 'Data export'],
  },
  {
    id: 'team', name: 'Team', price: { monthly: 49, yearly: 399 }, color: '#1D9E75', perUser: true,
    description: 'For teams that learn and grow together',
    cta: 'Start Team trial',
    features: ['Everything in Pro', 'Shared knowledge base', 'Team memory assistant', 'Internal docs search', 'Admin dashboard', 'Priority support', 'API access', 'Custom onboarding'],
  },
  {
    id: 'business', name: 'Business', price: { monthly: 199, yearly: 1499 }, color: '#3b82f6',
    description: 'Enterprise knowledge management at scale',
    cta: 'Contact sales', href: 'mailto:sales@wizemory.com',
    features: ['Everything in Team', 'Unlimited members', 'Dedicated success manager', 'Custom AI training', 'SLA guarantee', 'Compliance & audit', 'Custom integrations', 'White-label option'],
  },
]

const FAQ = [
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel from Settings. You keep access until period ends.' },
  { q: 'Do you support UPI / Indian cards?', a: 'Yes — Paddle supports UPI, net banking, and all Indian cards.' },
  { q: 'What happens to my data if I downgrade?', a: 'Your data is preserved. You just can\'t add new items beyond the free limit.' },
  { q: 'Is there a free trial for Pro?', a: 'The free plan lets you try everything with 50 items. No credit card needed.' },
  { q: 'Is my knowledge base private?', a: 'Completely private by default. We never sell or train AI on your data.' },
]

export default function PricingPage() {
  const [yearly, setYearly]         = useState(false)
  const [loading, setLoading]       = useState<string | null>(null)
  const [paddleReady, setPaddleReady] = useState(false)

  function initPaddle() {
    const Paddle = (window as any).Paddle
  
    if (!Paddle) return
  
    Paddle.Initialize({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      eventCallback: (event: any) => {
        console.log(event)
  
        if (event.name === 'checkout.completed') {
          window.location.href = '/dashboard/settings?upgraded=1'
        }
      },
    })
  
    setPaddleReady(true)
  }

  async function startCheckout(planId: string, href?: string) {
    if (href) { window.location.href = href; return }
    setLoading(planId)
    try {
      const res  = await fetch('/api/billing/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, yearly }),
      })
      const data = await res.json()

      if (data.url) {
        const Paddle = (window as any).Paddle
        if (Paddle && paddleReady) {
          Paddle.Checkout.open({
            transactionId: data.transactionId,
          }) // ✅ overlay, not redirect
        } else {
          window.location.href = data.url           // fallback
        }
      } else {
        toast.error(data.error ?? 'Something went wrong')
      }
    } catch { toast.error('Could not start checkout') }
    finally { setLoading(null) }
  }

  return (
    <div className="min-h-screen bg-ink-50">
      {/* ✅ Load Paddle.js */}
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        onLoad={initPaddle}
      />

      <nav className="border-b border-ink-100 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-ink-900">Wize<span className="text-violet-500">Mory</span></Link>
        <Link href="/auth/sign-up" className="px-4 py-2 bg-ink-900 text-ink-50 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors">Start free →</Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl text-ink-900 mb-4">Simple, honest pricing</h1>
          <p className="text-lg text-ink-500 mb-8">Start free. No credit card. Cancel anytime.</p>
          <div className="inline-flex items-center gap-2 bg-ink-100 rounded-full p-1">
            <button onClick={() => setYearly(false)}
              className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                !yearly ? 'bg-white text-ink-900' : 'text-ink-500')}>Monthly</button>
            <button onClick={() => setYearly(true)}
              className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                yearly ? 'bg-white text-ink-900' : 'text-ink-500')}>
              Yearly <span className="text-xs text-sage-600 font-semibold ml-1">save 30%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {PLANS.map(plan => (
            <div key={plan.id}
              className={cn('bg-white border rounded-2xl p-5 flex flex-col relative',
                plan.popular ? 'border-violet-300 ring-2 ring-violet-100' : 'border-ink-100')}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-violet-600 text-white text-xs font-medium rounded-full whitespace-nowrap">Most popular</div>
              )}
              <div className="mb-4">
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: plan.color }}>{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-3xl text-ink-900">
                    {plan.price.monthly === 0 ? 'Free' : `$${yearly ? Math.round((plan.id === 'pro' ? 99 : plan.id === 'team' ? 399 : 1499) / 12) : plan.price.monthly}`}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-xs text-ink-400">/mo{(plan as any).perUser ? '/user' : ''}</span>
                  )}
                </div>
                <p className="text-xs text-ink-500 leading-relaxed">{plan.description}</p>
              </div>

              <button onClick={() => startCheckout(plan.id, (plan as any).href)}
                disabled={loading === plan.id}
                className={cn('w-full py-2.5 rounded-xl text-sm font-medium transition-all mb-5 disabled:opacity-50',
                  plan.popular ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-ink-900 text-ink-50 hover:bg-ink-800')}>
                {loading === plan.id ? '…' : plan.cta}
              </button>

              <div className="space-y-1.5 flex-1">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-xs text-ink-600">
                    <span className="text-sage-500 font-bold mt-0.5 shrink-0">✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          {[
            { n: 'Priya Sharma',    r: 'PhD Researcher',   t: 'I save 30+ papers a week. WizeMory turned chaos into a knowledge base I actually use.',         a: 'PS' },
            { n: 'Marcus Chen',     r: 'Product Manager',  t: 'The AI connections feature linked two articles I\'d never have connected myself.',               a: 'MC' },
            { n: 'Sarah Williams',  r: 'Startup Founder',  t: 'Asked "what do I know about churn?" and got answers from 12 different saved articles.',          a: 'SW' },
            { n: 'Aditya Patel',    r: 'Content Creator',  t: 'The writing assistant uses my research to draft content that actually sounds like me.',           a: 'AP' },
          ].map(t => (
            <div key={t.n} className="bg-white border border-ink-100 rounded-2xl p-5">
              <div className="flex text-amber-400 text-xs mb-2">★★★★★</div>
              <p className="text-sm text-ink-700 leading-relaxed mb-4 italic">"{t.t}"</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-semibold">{t.a}</div>
                <div>
                  <div className="text-xs font-medium text-ink-900">{t.n}</div>
                  <div className="text-xs text-ink-400">{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl text-ink-900 text-center mb-6">FAQ</h2>
          <div className="space-y-3">
            {FAQ.map(f => (
              <div key={f.q} className="bg-white border border-ink-100 rounded-xl p-5">
                <div className="font-medium text-sm text-ink-900 mb-1.5">{f.q}</div>
                <p className="text-sm text-ink-500">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-ink-900 rounded-3xl p-10 text-center">
          <h2 className="font-display text-4xl text-ink-50 mb-3">Start building your second brain</h2>
          <p className="text-ink-400 mb-8">50 items free forever. No credit card. Cancel anytime.</p>
          <Link href="/auth/sign-up" className="inline-block px-10 py-4 bg-violet-500 text-white rounded-xl text-base font-medium hover:bg-violet-400 transition-colors">
            Start for free →
          </Link>
        </div>
      </main>
    </div>
  )
}