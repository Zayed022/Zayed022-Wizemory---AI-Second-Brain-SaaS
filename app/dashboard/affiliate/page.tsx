'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Payout {
  id: string
  amount: number
  status: string
  referralCode: string
  createdAt: string
}

interface AffiliateData {
  code: string
  referralUrl: string
  referralCount: number
  freeMonthsEarned: number
  progress: number
  totalEarned: number
  pendingPayouts: number
  paidOut: number
  payouts: Payout[]
  commission: number
}

export default function AffiliatePage() {
  const [data, setData]       = useState<AffiliateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    fetch('/api/affiliate')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d  => { setData(d); setLoading(false) })
      .catch(() => { setError('Could not load affiliate data. Please refresh.'); setLoading(false) })
  }, [])

  async function copyLink() {
    if (!data?.referralUrl) return
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(data.referralUrl)
      } else {
        const ta = document.createElement('textarea')
        ta.value = data.referralUrl; ta.style.position = 'fixed'; ta.style.opacity = '0'
        document.body.appendChild(ta); ta.focus(); ta.select()
        document.execCommand('copy'); document.body.removeChild(ta)
      }
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    } catch {
      const input = document.getElementById('aff-url') as HTMLInputElement
      input?.select()
    }
  }

  function share(platform: 'twitter' | 'whatsapp' | 'linkedin') {
    if (!data?.referralUrl) return
    const msg = `I use WizeMory to save articles and build my AI second brain. It summarises everything automatically.\n\nTry it free: ${data.referralUrl}`
    const urls: Record<string, string> = {
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.referralUrl)}`,
    }
    window.open(urls[platform], '_blank', 'noopener,noreferrer')
  }

  if (loading) return (
    <div className="p-6 max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-52 bg-ink-100 rounded-lg" />
      <div className="h-28 bg-ink-100 rounded-2xl" />
      <div className="h-24 bg-ink-100 rounded-2xl" />
      <div className="h-24 bg-ink-100 rounded-2xl" />
    </div>
  )

  if (error || !data) return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
        <div className="text-2xl mb-2">⚠️</div>
        <p className="text-sm text-red-700">{error || 'Something went wrong.'}</p>
        <button onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
          Refresh
        </button>
      </div>
    </div>
  )

  const {
    code, referralUrl, referralCount, freeMonthsEarned,
    progress, totalEarned, pendingPayouts, paidOut, payouts, commission,
  } = data

  const pct = Math.min((progress / 3) * 100, 100)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-ink-900">Affiliate dashboard</h1>
        <p className="text-ink-400 text-sm mt-1">
          Refer users and earn rewards. {commission}% commission on paid referrals.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total referrals',    value: referralCount,         sub: 'all time'       },
          { label: 'Free months earned', value: freeMonthsEarned,      sub: 'from referrals' },
          { label: 'Progress to reward', value: `${progress % 3}/3`,   sub: 'current batch'  },
        ].map(s => (
          <div key={s.label} className="bg-white border border-ink-100 rounded-2xl p-4 text-center">
            <div className="font-display text-3xl text-ink-900 mb-1">{s.value}</div>
            <div className="text-[10px] text-ink-400 uppercase tracking-wide font-medium leading-tight">{s.label}</div>
            <div className="text-[10px] text-ink-300 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-medium text-ink-700">Refer 3 friends → 1 free Pro month</span>
          <span className="text-sm font-bold text-violet-600">{progress % 3}/3</span>
        </div>
        <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-ink-400 mt-2">
          {freeMonthsEarned > 0
            ? `🎉 You have earned ${freeMonthsEarned} free month${freeMonthsEarned !== 1 ? 's' : ''} of Pro so far!`
            : 'Share your link below to start earning free Pro months.'}
        </p>
      </div>

      {/* Referral link */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5">
        <div className="text-sm font-medium text-ink-700 mb-3">Your referral link</div>
        <div className="flex gap-2">
          <input
            id="aff-url"
            readOnly
            value={referralUrl}
            onFocus={e => e.target.select()}
            className="flex-1 px-3 py-2.5 bg-ink-50 border border-ink-100 rounded-xl text-sm text-ink-600 font-mono truncate outline-none focus:border-violet-300 cursor-text"
          />
          <button
            onClick={copyLink}
            className={cn(
              'shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              copied ? 'bg-emerald-500 text-white' : 'bg-ink-900 text-ink-50 hover:bg-ink-800'
            )}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-[10px] text-ink-400 mt-2">
          Your code: <span className="font-mono font-semibold text-ink-600">{code}</span>
        </p>
      </div>

      {/* Share buttons */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5">
        <div className="text-sm font-medium text-ink-700 mb-3">Share directly</div>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'twitter',  label: '𝕏 Twitter / X', cls: 'bg-black hover:bg-gray-900 text-white' },
            { id: 'whatsapp', label: 'WhatsApp',       cls: 'bg-[#25D366] hover:bg-[#20bb5a] text-white' },
            { id: 'linkedin', label: 'LinkedIn',       cls: 'bg-[#0A66C2] hover:bg-[#095ab5] text-white' },
          ].map(b => (
            <button key={b.id} onClick={() => share(b.id as any)}
              className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-colors', b.cls)}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-50 flex items-center justify-between">
          <div className="text-sm font-medium text-ink-700">Reward history</div>
          {payouts.length > 0 && (
            <span className="text-xs text-ink-400">{payouts.length} record{payouts.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {payouts.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="text-3xl mb-2">🎁</div>
            <p className="text-sm text-ink-500 font-medium">No rewards yet</p>
            <p className="text-xs text-ink-400 mt-1">
              Refer 3 friends to earn your first free Pro month.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ink-50">
            {payouts.map(p => (
              <div key={p.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <div className="text-sm text-ink-700 font-medium">
                    ${p.amount.toFixed(2)} reward
                  </div>
                  <div className="text-xs text-ink-400 mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                </div>
                <span className={cn(
                  'text-xs font-medium px-2.5 py-1 rounded-full',
                  p.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                )}>
                  {p.status === 'paid' ? '✓ Paid' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Summary footer — only show if there are payouts */}
        {payouts.length > 0 && (
          <div className="px-5 py-3 bg-ink-50 border-t border-ink-100 flex gap-6">
            <div>
              <div className="text-xs text-ink-400">Total earned</div>
              <div className="text-sm font-bold text-ink-900">${totalEarned.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-ink-400">Paid out</div>
              <div className="text-sm font-bold text-emerald-700">${paidOut.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-ink-400">Pending</div>
              <div className="text-sm font-bold text-amber-700">${pendingPayouts.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
        <div className="text-sm font-medium text-violet-900 mb-3">How affiliate rewards work</div>
        <div className="space-y-2 text-xs text-violet-800 leading-relaxed">
          {[
            'Share your unique referral link on social media, newsletters, or directly with friends.',
            'When someone signs up using your link, they are counted as your referral.',
            'Every 3 referrals earns you 1 free month of WizeMory Pro (worth $12).',
            'There is no cap — keep referring and keep earning free months.',
            'Rewards are applied to your account automatically.',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-violet-200 text-violet-700 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-ink-900">Want Pro features now?</div>
          <div className="text-xs text-ink-400 mt-0.5">
            Upgrade for unlimited AI, knowledge graph, weekly digest, and more.
          </div>
        </div>
        <Link href="/pricing"
          className="shrink-0 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors whitespace-nowrap">
          Upgrade — $12/mo
        </Link>
      </div>

    </div>
  )
}