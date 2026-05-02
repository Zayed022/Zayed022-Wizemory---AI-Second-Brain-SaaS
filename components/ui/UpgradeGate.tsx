'use client'
import Link from 'next/link'

interface Props {
  feature:     string   // "AI Agent", "Knowledge Graph", etc.
  description: string   // What the user is missing
  bullets:     string[] // 3-4 concrete benefits they'd unlock
  icon?:       string   // emoji
}

export default function UpgradeGate({ feature, description, bullets, icon = '✦' }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl mx-auto mb-6">
          {icon}
        </div>

        {/* Headline */}
        <h2 className="font-display text-3xl text-ink-900 mb-3">
          {feature} is a Pro feature
        </h2>
        <p className="text-ink-500 text-sm leading-relaxed mb-6">
          {description}
        </p>

        {/* Benefits */}
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 mb-6 text-left">
          <div className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-3">
            Upgrade to Pro to unlock
          </div>
          <ul className="space-y-2">
            {bullets.map(b => (
              <li key={b} className="flex items-start gap-2 text-sm text-violet-900">
                <span className="text-violet-500 font-bold mt-0.5 shrink-0">✓</span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Link href="/pricing"
          className="inline-block w-full py-3.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors mb-3">
          Upgrade to Pro — $12/month →
        </Link>
        <Link href="/demo"
          className="inline-block text-xs text-ink-400 hover:text-ink-600 transition-colors">
          See a live demo first
        </Link>

        {/* Free plan note */}
        <p className="text-[10px] text-ink-300 mt-4">
          Cancel anytime · No credit card on free plan · 50 items always free
        </p>
      </div>
    </div>
  )
}
