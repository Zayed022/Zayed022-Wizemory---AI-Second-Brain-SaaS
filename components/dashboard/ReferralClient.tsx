'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ReferralClient({
  code, referralUrl, referralCount, plan
}: { code: string; referralUrl: string; referralCount: number; plan: string }) {
  const [copied, setCopied] = useState(false)
  const needed = Math.max(0, 3 - referralCount)
  const earned = referralCount >= 3

  async function copyLink() {
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  function shareTwitter() {
    const text = encodeURIComponent(`I've been using WizeMory to save articles and build my second brain. It summarises everything with AI so I never forget what I read.\n\nTry it free → ${referralUrl}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`Check out WizeMory — an AI second brain that summarises everything you save. Try it free: ${referralUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-900">Refer &amp; earn</h1>
        <p className="text-ink-400 text-sm mt-1">Share WizeMory. Earn free Pro.</p>
      </div>

      {/* Reward card */}
      <div className={cn(
        'rounded-2xl p-6 mb-6 border',
        earned ? 'bg-sage-50 border-sage-200' : 'bg-violet-50 border-violet-100'
      )}>
        {earned ? (
          <div className="text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="font-display text-2xl text-sage-900 mb-2">You've earned a free month!</h2>
            <p className="text-sage-700 text-sm">You referred {referralCount} friends. Your next month of Pro is on us — we'll apply it automatically.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-violet-900">Refer 3 friends, get 1 month free</div>
                <div className="text-sm text-violet-600 mt-0.5">{referralCount}/3 friends referred · {needed} more to go</div>
              </div>
              <div className="text-3xl font-display text-violet-700">{referralCount}/3</div>
            </div>
            <div className="h-2.5 bg-violet-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${Math.min((referralCount / 3) * 100, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Referral link */}
      <div className="bg-white border border-ink-100 rounded-2xl p-6 mb-6">
        <div className="text-sm font-medium text-ink-700 mb-3">Your referral link</div>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2.5 bg-ink-50 border border-ink-100 rounded-xl text-sm text-ink-600 font-mono truncate">
            {referralUrl}
          </div>
          <button onClick={copyLink}
            className={cn(
              'px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0',
              copied ? 'bg-sage-500 text-white' : 'bg-ink-900 text-ink-50 hover:bg-ink-800'
            )}>
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
        </div>
        <p className="text-xs text-ink-400 mt-2">Friends who sign up with your link count toward your reward.</p>
      </div>

      {/* Share buttons */}
      <div className="bg-white border border-ink-100 rounded-2xl p-6 mb-6">
        <div className="text-sm font-medium text-ink-700 mb-4">Share directly</div>
        <div className="flex gap-3">
          <button onClick={shareTwitter}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors">
            𝕏 Share on Twitter
          </button>
          <button onClick={shareWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
            Share on WhatsApp
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border border-ink-100 rounded-2xl p-6">
        <div className="text-sm font-medium text-ink-700 mb-4">How it works</div>
        <div className="space-y-3">
          {[
            ['1', 'Share your unique link with friends'],
            ['2', 'They sign up for WizeMory using your link'],
            ['3', 'Once 3 friends sign up, you get 1 month of Pro free'],
            ['4', 'No limit — keep referring for more free months!'],
          ].map(([n, t]) => (
            <div key={n} className="flex items-center gap-3 text-sm text-ink-600">
              <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-medium shrink-0">{n}</span>
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
