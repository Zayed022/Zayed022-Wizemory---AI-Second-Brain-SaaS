'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ReferralData {
  code: string
  url: string
  referralCount: number
  freeMonthsEarned: number
  progress: number
  progressTotal: number
}

export default function ReferralClient() {
  const [data, setData]       = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    fetch('/api/referral')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d  => { setData(d); setLoading(false) })
      .catch(() => { setError('Could not load referral data. Please refresh.'); setLoading(false) })
  }, [])

  async function copyLink() {
    if (!data?.url) return
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(data.url)
      } else {
        const ta = document.createElement('textarea')
        ta.value = data.url; ta.style.position = 'fixed'; ta.style.opacity = '0'
        document.body.appendChild(ta); ta.focus(); ta.select()
        document.execCommand('copy'); document.body.removeChild(ta)
      }
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    } catch {
      const input = document.getElementById('ref-url') as HTMLInputElement
      input?.select()
    }
  }

  function share(platform: 'twitter' | 'whatsapp' | 'linkedin') {
    if (!data?.url) return
    const msg = `I use WizeMory to save articles and build my AI second brain. It summarises everything automatically.\n\nTry it free: ${data.url}`
    const urls: Record<string, string> = {
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`,
    }
    window.open(urls[platform], '_blank', 'noopener,noreferrer')
  }

  if (loading) return (
    <div className="p-6 max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-ink-100 rounded-lg" />
      <div className="h-28 bg-ink-100 rounded-2xl" />
      <div className="h-20 bg-ink-100 rounded-2xl" />
      <div className="h-20 bg-ink-100 rounded-2xl" />
    </div>
  )

  if (error || !data) return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
        <div className="text-2xl mb-2">⚠️</div>
        <p className="text-sm text-red-700">{error || 'Something went wrong.'}</p>
        <button onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium">
          Refresh
        </button>
      </div>
    </div>
  )

  const { code, url, referralCount, freeMonthsEarned, progress, progressTotal } = data
  const pct = Math.min((progress / progressTotal) * 100, 100)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-3xl text-ink-900">Refer &amp; Earn</h1>
        <p className="text-ink-400 text-sm mt-1">Invite friends. Every 3 referrals = 1 free Pro month.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total referrals',    value: referralCount },
          { label: 'Free months earned', value: freeMonthsEarned },
          { label: 'Progress to next',   value: `${progress}/${progressTotal}` },
        ].map(s => (
          <div key={s.label} className="bg-white border border-ink-100 rounded-2xl p-4 text-center">
            <div className="font-display text-3xl text-ink-900 mb-1">{s.value}</div>
            <div className="text-[10px] text-ink-400 uppercase tracking-wide font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-medium text-ink-700">Refer 3 friends → 1 free Pro month</span>
          <span className="text-sm font-bold text-violet-600">{progress}/{progressTotal}</span>
        </div>
        <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-ink-400 mt-2">
          {freeMonthsEarned > 0
            ? `🎉 You have earned ${freeMonthsEarned} free month${freeMonthsEarned !== 1 ? 's' : ''} of Pro!`
            : progress > 0
              ? `${progressTotal - progress} more referral${progressTotal - progress !== 1 ? 's' : ''} to earn your next free month.`
              : 'Share your link below to get started.'}
        </p>
      </div>

      {/* Link */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5">
        <div className="text-sm font-medium text-ink-700 mb-3">Your referral link</div>
        <div className="flex gap-2">
          <input id="ref-url" readOnly value={url}
            onFocus={e => e.target.select()}
            className="flex-1 px-3 py-2.5 bg-ink-50 border border-ink-100 rounded-xl text-sm text-ink-600 font-mono truncate outline-none focus:border-violet-300 cursor-text" />
          <button onClick={copyLink}
            className={cn('shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              copied ? 'bg-emerald-500 text-white' : 'bg-ink-900 text-ink-50 hover:bg-ink-800')}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-[10px] text-ink-400 mt-2">
          Your code: <span className="font-mono font-semibold text-ink-600">{code}</span>
        </p>
      </div>

      {/* Share */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5">
        <div className="text-sm font-medium text-ink-700 mb-3">Share directly</div>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'twitter',  label: '𝕏 Twitter / X', bg: 'bg-black hover:bg-gray-900 text-white' },
            { id: 'whatsapp', label: 'WhatsApp',       bg: 'bg-[#25D366] hover:bg-[#20bb5a] text-white' },
            { id: 'linkedin', label: 'LinkedIn',       bg: 'bg-[#0A66C2] hover:bg-[#095ab5] text-white' },
          ].map(b => (
            <button key={b.id} onClick={() => share(b.id as any)}
              className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-colors', b.bg)}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
        <div className="text-sm font-medium text-violet-900 mb-3">How it works</div>
        <div className="space-y-3">
          {[
            { n: '1', t: 'Share your link',      d: 'Send it to friends, post on social, or add to your newsletter.' },
            { n: '2', t: 'Friends sign up',       d: 'Anyone who signs up via your link counts as a referral.' },
            { n: '3', t: 'Earn free Pro months',  d: 'Every 3 referrals = 1 free month of Pro. No cap — keep going!' },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-200 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</div>
              <div>
                <div className="text-sm font-medium text-violet-900">{s.t}</div>
                <div className="text-xs text-violet-700 mt-0.5 leading-relaxed">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade nudge */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-ink-900">Want Pro features right now?</div>
          <div className="text-xs text-ink-400 mt-0.5">Upgrade to unlock unlimited AI, knowledge graph, weekly digest, and more.</div>
        </div>
        <Link href="/pricing"
          className="shrink-0 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors whitespace-nowrap">
          Upgrade — $12/mo
        </Link>
      </div>
    </div>
  )
}