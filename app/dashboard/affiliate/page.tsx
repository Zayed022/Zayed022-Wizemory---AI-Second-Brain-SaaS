'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AffiliatePage() {
  const [data, setData]   = useState<any>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/affiliate').then(r => r.json()).then(setData)
  }, [])

  async function copy() {
    await navigator.clipboard.writeText(data.referralUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast.success('Referral link copied!')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-900">Affiliate dashboard</h1>
        <p className="text-ink-400 text-sm mt-1">Earn rewards by referring people to WizeMory</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total referrals',  value: data?.referralCount ?? 0,        suffix: '' },
          { label: 'Free months earned', value: data?.freeMonthsEarned ?? 0,   suffix: '' },
          { label: 'Progress to reward', value: `${data?.progress ?? 0}/3`,    suffix: '' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-ink-100 rounded-2xl p-5 text-center">
            <div className="font-display text-3xl text-ink-900 mb-1">{m.value}{m.suffix}</div>
            <div className="text-xs text-ink-400 uppercase tracking-wide font-medium">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-ink-700">Refer 3 friends → 1 free Pro month</span>
          <span className="text-sm text-violet-600 font-medium">{data?.progress ?? 0}/3</span>
        </div>
        <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all"
            style={{ width: `${Math.min(((data?.progress ?? 0) / 3) * 100, 100)}%` }} />
        </div>
        <p className="text-xs text-ink-400 mt-2">After 3 referrals, you get 1 month of Pro free. Keep going for more months!</p>
      </div>

      {/* Link */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5 mb-4">
        <div className="text-sm font-medium text-ink-700 mb-3">Your referral link</div>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2.5 bg-ink-50 rounded-xl text-sm text-ink-600 font-mono truncate">
            {data?.referralUrl ?? '…'}
          </div>
          <button onClick={copy}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0',
              copied ? 'bg-sage-500 text-white' : 'bg-ink-900 text-ink-50 hover:bg-ink-800')}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Share buttons */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5 mb-4">
        <div className="text-sm font-medium text-ink-700 mb-3">Share directly</div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: '𝕏 Twitter/X', action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I use WizeMory to save articles and build my AI second brain. It summarises everything automatically.\n\nTry it free: ${data?.referralUrl}`)}`, '_blank') },
            { label: 'WhatsApp',    action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`Try WizeMory – AI second brain that summarises everything you save: ${data?.referralUrl}`)}`, '_blank') },
            { label: 'LinkedIn',    action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data?.referralUrl ?? '')}`, '_blank') },
          ].map(s => (
            <button key={s.label} onClick={s.action}
              className="px-4 py-2 bg-ink-50 border border-ink-100 rounded-xl text-sm text-ink-700 hover:bg-ink-100 transition-colors">
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
        <div className="text-sm font-medium text-violet-900 mb-3">How it works</div>
        <div className="space-y-2">
          {[
            'Share your unique link with friends, on social media, or in your newsletter',
            'When someone signs up using your link, they are counted as your referral',
            'After 3 referrals you earn 1 free month of Pro (worth $12)',
            'There is no cap — keep referring and keep earning free months',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-violet-800">
              <span className="w-5 h-5 rounded-full bg-violet-200 text-violet-700 text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">{i+1}</span>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
