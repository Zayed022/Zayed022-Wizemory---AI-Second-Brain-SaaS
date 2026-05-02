'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

// Nav items with optional Pro badge
const NAV: Array<{ href: string; label: string; icon: string; pro?: boolean }> = [
  { href: '/dashboard',              label: 'All items',       icon: '⊞' },
  { href: '/dashboard/articles',     label: 'Articles',        icon: '◈' },
  { href: '/dashboard/notes',        label: 'Notes',           icon: '≡' },
  { href: '/dashboard/voice',        label: 'Voice memos',     icon: '◎' },
  { href: '/dashboard/collections',  label: 'Collections',     icon: '❑' },
  { href: '/dashboard/highlights',   label: 'Highlights',      icon: '✎' },
  { href: '/dashboard/connections',  label: 'Connections',     icon: '✦', pro: true },
  { href: '/dashboard/graph',        label: 'Knowledge graph', icon: '◎', pro: true },
  { href: '/dashboard/reminders',    label: 'Review queue',    icon: '↻', pro: true },
  { href: '/dashboard/coach',        label: 'AI coach',        icon: '🧠', pro: true },
  { href: '/dashboard/stats',        label: 'My stats',        icon: '📊' },
  { href: '/dashboard/write',        label: 'AI writer',       icon: '✍️', pro: true },
  { href: '/dashboard/agent',        label: 'AI agent',        icon: '⚡', pro: true },
  { href: '/dashboard/digest',       label: 'Digest',          icon: '◇', pro: true },
  { href: '/dashboard/search',       label: 'Search',          icon: '🔍' },
]

const BOTTOM_NAV: Array<{ href: string; label: string; icon: string; highlight?: boolean; violet?: boolean }> = [
  { href: '/dashboard/referral',  label: 'Refer & earn',     icon: '🎁', highlight: true },
  { href: '/dashboard/affiliate', label: 'Affiliate',         icon: '💰' },
  { href: '/dashboard/settings',  label: 'Settings',          icon: '⚙' },
  { href: '/pricing',             label: 'Upgrade to Pro ✦',  icon: '',   highlight: true, violet: true },
]

interface Props { children: React.ReactNode; plan?: string }

export default function DashboardLayout({ children, plan }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#f4f3ef' }}>
      {/* Top bar */}
      <header className="h-14 bg-white/90 border-b border-ink-100 flex items-center px-4 gap-4 z-40 shrink-0" style={{ backdropFilter: 'blur(16px)' }}>
        <button className="md:hidden p-2 rounded-lg hover:bg-ink-100 transition-colors" onClick={() => setOpen(!open)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" strokeLinecap="round"/>
          </svg>
        </button>
        <Link href="/" className="font-display text-xl text-ink-900 shrink-0">Wize<span className="text-violet-500">Mory</span></Link>
        <div className="flex-1 max-w-md relative hidden md:block">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="4"/><path d="M10 10L13 13" strokeLinecap="round"/>
          </svg>
          <input placeholder="Search your knowledge base…" readOnly
            className="w-full pl-8 pr-4 py-2 bg-ink-100 rounded-xl text-sm text-ink-700 placeholder-ink-400 border border-transparent focus:border-ink-300 focus:bg-white outline-none transition-all cursor-pointer"
            onFocus={() => { window.location.href = '/dashboard/search' }} />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/dashboard/add"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-ink-900 text-ink-50 rounded-lg text-sm font-medium hover:bg-ink-800 transition-colors">
            + Add
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          'w-56 shrink-0 bg-white border-r border-ink-100 flex flex-col overflow-y-auto',
          'absolute md:relative inset-y-0 left-0 z-30 transition-transform duration-200 md:translate-x-0',
          open ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        )}>
          <nav className="px-3 py-3 space-y-0.5">
            {NAV.map(item => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all group',
                    isActive
                      ? 'bg-ink-900 text-ink-50 font-medium'
                      : 'text-ink-500 hover:text-ink-900 hover:bg-ink-50'
                  )}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm w-5 text-center leading-none">{item.icon}</span>
                    {item.label}
                  </div>
                  {item.pro && !isActive && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-600 group-hover:bg-violet-100 shrink-0 ml-1">
                      PRO
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom nav */}
          <div className="mt-auto px-3 pb-3 pt-3 border-t border-ink-100 mx-3 space-y-0.5">
            {BOTTOM_NAV.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all',
                  item.violet   ? 'text-violet-600 hover:bg-violet-50 font-medium' :
                  item.highlight ? 'text-emerald-600 hover:bg-emerald-50' :
                  'text-ink-400 hover:text-ink-900 hover:bg-ink-50'
                )}>
                {item.icon && <span className="text-sm">{item.icon}</span>}
                {item.label}
              </Link>
            ))}
          </div>
        </aside>

        {open && (
          <div className="fixed inset-0 bg-ink-900/20 z-20 md:hidden" onClick={() => setOpen(false)} />
        )}

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
