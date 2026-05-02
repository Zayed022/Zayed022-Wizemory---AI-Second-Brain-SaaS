'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const PLANS = [
  {
    id:    'free',
    label: 'Free',
    price: { monthly: 0, yearly: 0 },
    color: '#928c82',
    features: ['50 items', '10 AI queries/month', 'Basic search', 'Collections'],
  },
  {
    id:    'pro',
    label: 'Pro',
    price: { monthly: 12, yearly: 99 },
    color: '#7340f5',
    features: ['Unlimited items', 'Unlimited AI', 'Knowledge graph', 'Weekly digest', 'Spaced repetition', 'YouTube summaries', 'AI Writing assistant', 'Data export'],
  },
  {
    id:    'team',
    label: 'Team',
    price: { monthly: 49, yearly: 399 },
    color: '#1D9E75',
    perUser: true,
    features: ['Everything in Pro', 'Shared knowledge base', 'Team memory assistant', 'Admin dashboard', 'API access'],
  },
  {
    id:    'business',
    label: 'Business',
    price: { monthly: 199, yearly: 1499 },
    color: '#3b82f6',
    features: ['Everything in Team', 'Unlimited members', 'Custom AI training', 'SLA guarantee', 'Dedicated support'],
  },
]

const PLAN_DESCRIPTIONS: Record<string, string> = {
  FREE:     'Limited access — 50 items, 10 AI queries/month',
  PRO:      'Unlimited items, AI, graph, digest, export',
  TEAM:     'Shared knowledge base + team features',
  BUSINESS: 'Enterprise features + SLA + unlimited members',
}

export default function SettingsClient({ user, clerkUser }: { user: any; clerkUser: any }) {
  const [portalLoading, setPortalLoading]   = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState('')
  const [exporting, setExporting]           = useState(false)
  const [yearly, setYearly]                 = useState(false)

  async function openBillingPortal() {
    setPortalLoading(true)
    try {
      const res  = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error(data.error ?? 'Could not open billing portal')
    } catch { toast.error('Network error') }
    finally { setPortalLoading(false) }
  }

  async function startCheckout(planId: string) {
    setCheckoutLoading(planId)
    try {
      const res  = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ planId, yearly }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error(data.error ?? 'Checkout failed')
    } catch { toast.error('Network error') }
    finally { setCheckoutLoading('') }
  }

  async function exportData(format: 'zip' | 'json') {
    setExporting(true)
    try {
      const endpoint = format === 'zip' ? '/api/export-knowledge' : '/api/export-knowledge?format=json'
      const res      = await fetch(endpoint)
      if (!res.ok) { toast.error('Export failed'); return }
      const blob     = await res.blob()
      const a        = document.createElement('a')
      a.href         = URL.createObjectURL(blob)
      a.download     = format === 'zip' ? `wizemory-export-${Date.now()}.zip` : `wizemory-export-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(a.href)
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch { toast.error('Export failed') }
    finally { setExporting(false) }
  }

  const currentPlan    = user.plan ?? 'FREE'
  const isUpgraded     = currentPlan !== 'FREE'
  const hasBillingAcct = !!user.stripeCustomerId

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-900 mb-1">Settings</h1>
        <p className="text-ink-400 text-sm">Manage your account and subscription</p>
      </div>

      {/* ── Upgrade success banner ─────────────────────────────────────── */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('upgraded') && (
        <div className="bg-sage-50 border border-sage-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-medium text-sage-900 text-sm">Welcome to {currentPlan}!</p>
            <p className="text-sage-700 text-xs mt-0.5">All features are now unlocked. Enjoy WizeMory.</p>
          </div>
        </div>
      )}

      {/* ── Profile ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-ink-100 rounded-2xl p-6">
        <h2 className="font-medium text-ink-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          {clerkUser.imageUrl ? (
            <Image src={clerkUser.imageUrl} alt="Avatar" width={48} height={48} className="rounded-full" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-medium text-lg">
              {(clerkUser.name?.[0] ?? clerkUser.email?.[0] ?? 'U').toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium text-ink-900">{clerkUser.name ?? 'No name set'}</div>
            <div className="text-sm text-ink-400">{clerkUser.email}</div>
          </div>
        </div>
      </div>

      {/* ── Current plan ───────────────────────────────────────────────── */}
      <div className="bg-white border border-ink-100 rounded-2xl p-6">
        <h2 className="font-medium text-ink-900 mb-4">Current plan</h2>

        <div className="flex items-center justify-between p-4 bg-ink-50 rounded-xl mb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full"
                style={{ background: PLANS.find(p => p.id === currentPlan.toLowerCase())?.color ?? '#928c82' }} />
              <span className="font-medium text-ink-900">{currentPlan} Plan</span>
              {currentPlan === 'FREE' && (
                <span className="text-[10px] bg-ink-200 text-ink-600 px-2 py-0.5 rounded-full font-medium">Free</span>
              )}
            </div>
            <p className="text-xs text-ink-500 mt-1">{PLAN_DESCRIPTIONS[currentPlan] ?? ''}</p>
            {currentPlan === 'FREE' && (
              <p className="text-xs text-ink-400 mt-1">
                {user.itemCount ?? 0} / 50 items used
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {hasBillingAcct && (
              <button onClick={openBillingPortal} disabled={portalLoading}
                className="px-3 py-2 bg-white border border-ink-200 rounded-xl text-xs font-medium text-ink-600 hover:bg-ink-50 disabled:opacity-50 transition-all">
                {portalLoading ? '…' : 'Manage billing'}
              </button>
            )}
          </div>
        </div>

        {/* Usage bar for free plan */}
        {currentPlan === 'FREE' && (
          <div className="mb-5">
            <div className="flex justify-between text-xs text-ink-500 mb-1.5">
              <span>Items saved</span>
              <span>{user.itemCount ?? 0} / 50</span>
            </div>
            <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', (user.itemCount ?? 0) > 40 ? 'bg-red-400' : 'bg-violet-400')}
                style={{ width: `${Math.min(((user.itemCount ?? 0) / 50) * 100, 100)}%` }}
              />
            </div>
            {(user.itemCount ?? 0) > 40 && (
              <p className="text-xs text-red-500 mt-1.5">You're almost at the limit. Upgrade to continue saving.</p>
            )}
          </div>
        )}

        {/* Billing cycle toggle */}
        {currentPlan === 'FREE' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-ink-700">Upgrade your plan</span>
              <div className="flex items-center gap-1.5 bg-ink-100 rounded-full p-1">
                <button onClick={() => setYearly(false)}
                  className={cn('px-3 py-1 rounded-full text-xs font-medium transition-all',
                    !yearly ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}>
                  Monthly
                </button>
                <button onClick={() => setYearly(true)}
                  className={cn('px-3 py-1 rounded-full text-xs font-medium transition-all',
                    yearly ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}>
                  Yearly <span className="text-[10px] text-sage-600 font-semibold">–30%</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3">
              {PLANS.filter(p => p.id !== 'free').map(plan => (
                <div key={plan.id}
                  className={cn('border rounded-xl p-4 flex items-center justify-between transition-all',
                    plan.id === 'pro' ? 'border-violet-200 bg-violet-50/50' : 'border-ink-100 bg-white')}>
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: plan.color }} />
                      <span className="font-medium text-sm text-ink-900">{plan.label}</span>
                      {plan.id === 'pro' && (
                        <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">Most popular</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-display text-xl text-ink-900">
                        ${yearly ? Math.round((plan.price.yearly) / 12) : plan.price.monthly}
                      </span>
                      <span className="text-xs text-ink-400">/mo{plan.perUser ? '/user' : ''}</span>
                      {yearly && <span className="text-xs text-sage-600 font-medium">billed ${plan.price.yearly}/yr</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {plan.features.slice(0, 3).map(f => (
                        <span key={f} className="text-[10px] text-ink-500">✓ {f}</span>
                      ))}
                      {plan.features.length > 3 && (
                        <span className="text-[10px] text-ink-400">+{plan.features.length - 3} more</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => startCheckout(plan.id)}
                    disabled={!!checkoutLoading}
                    className={cn(
                      'shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50',
                      plan.id === 'pro'
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'bg-ink-900 text-ink-50 hover:bg-ink-800'
                    )}>
                    {checkoutLoading === plan.id ? '…' : `Get ${plan.label}`}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Already on paid plan */}
        {currentPlan !== 'FREE' && (
          <div className="text-center py-2">
            <p className="text-sm text-ink-500 mb-3">Need to change or cancel your plan?</p>
            <button onClick={openBillingPortal} disabled={portalLoading}
              className="px-5 py-2.5 bg-white border border-ink-200 rounded-xl text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50 transition-all">
              {portalLoading ? 'Opening…' : 'Open billing portal →'}
            </button>
          </div>
        )}
      </div>

      {/* ── Data export ────────────────────────────────────────────────── */}
      <div className="bg-white border border-ink-100 rounded-2xl p-6">
        <h2 className="font-medium text-ink-900 mb-1">Export your data</h2>
        <p className="text-xs text-ink-400 mb-4">Download everything you've saved in portable formats.</p>
        <div className="flex gap-3">
          <button onClick={() => exportData('zip')} disabled={exporting}
            className="flex-1 py-2.5 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 disabled:opacity-50 transition-all">
            {exporting ? 'Exporting…' : 'Export as ZIP (Markdown + Graph)'}
          </button>
          <button onClick={() => exportData('json')} disabled={exporting}
            className="flex-1 py-2.5 bg-white border border-ink-200 text-ink-700 rounded-xl text-sm font-medium hover:bg-ink-50 disabled:opacity-50 transition-all">
            Export as JSON
          </button>
        </div>
      </div>

      {/* ── Privacy & GDPR ─────────────────────────────────────────────── */}
      <div className="bg-white border border-ink-100 rounded-2xl p-6">
        <h2 className="font-medium text-ink-900 mb-1">Privacy & GDPR</h2>
        <p className="text-xs text-ink-400 mb-4">Your data is fully portable and you can delete it at any time.</p>
        <div className="space-y-2 text-xs text-ink-500">
          {[
            '✓ Your knowledge base is private by default',
            '✓ We never sell or train AI on your data',
            '✓ Export all your data anytime (portability)',
            '✓ Request full data deletion under GDPR Art. 17',
          ].map(line => <p key={line}>{line}</p>)}
        </div>
        <div className="mt-4 flex gap-3">
          <Link href="/privacy" className="text-xs text-violet-600 hover:text-violet-700">Privacy policy →</Link>
          <button
            onClick={async () => {
              if (!confirm('Are you sure? This permanently deletes all your data. This cannot be undone.')) return
              const res = await fetch('/api/privacy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'erase_all' }) })
              if (res.ok) { toast.success('Data deleted. Redirecting…'); setTimeout(() => window.location.href = '/', 2000) }
              else toast.error('Deletion failed')
            }}
            className="text-xs text-red-500 hover:text-red-600">
            Request data deletion →
          </button>
        </div>
      </div>

      {/* ── Danger zone ────────────────────────────────────────────────── */}
      <div className="border border-red-100 rounded-2xl p-5 bg-red-50/30">
        <h2 className="font-medium text-red-800 mb-1 text-sm">Danger zone</h2>
        <p className="text-xs text-red-600 mb-3">Permanently delete your account and all associated data.</p>
        <button
          onClick={() => toast.error('Please contact privacy@wizemory.com to delete your account')}
          className="px-4 py-2 border border-red-200 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-all">
          Delete account
        </button>
      </div>
    </div>
  )
}
