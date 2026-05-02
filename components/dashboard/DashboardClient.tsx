'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { formatRelative, getItemTypeLabel, cn, truncate } from '@/lib/utils'
import type { Item, User } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Props {
  user: User
  initialItems: Item[]
  initialConnections: any[]
  stats: any[]
  aiQueriesUsed?: number
  aiQueryLimit?:  number
}

interface Message { role: 'user' | 'ai'; content: string; loading?: boolean }

const SUGGESTIONS = [
  'What have I saved this week?',
  'What are my key insights about productivity?',
  'Find connections between my recent articles',
  'Summarise everything I know about AI',
]

const TYPE_COLORS: Record<string, string> = {
  ARTICLE:  'bg-blue-50 text-blue-700',
  NOTE:     'bg-violet-50 text-violet-700',
  VOICE:    'bg-amber-50 text-amber-700',
  PDF:      'bg-red-50 text-red-700',
  YOUTUBE:  'bg-red-50 text-red-700',
  BOOKMARK: 'bg-emerald-50 text-emerald-700',
  PODCAST:  'bg-cyan-50 text-cyan-700',
}

// Simulated processing step labels for UX — the actual steps happen server-side
// The UI cycles through these while polling to give a sense of progress
const PROCESSING_STEPS = [
  'Fetching content…',
  'Analysing with AI…',
  'Extracting insights…',
  'Finalising…',
]

// ── ProcessingBadge ───────────────────────────────────────────────────────────
function ProcessingBadge({ itemId }: { itemId: string }) {
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setStepIdx(i => (i + 1) % PROCESSING_STEPS.length)
    }, 2500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
      <span className="text-[10px] font-medium text-amber-700 whitespace-nowrap">
        {PROCESSING_STEPS[stepIdx]}
      </span>
    </div>
  )
}

// ── FailedBadge ───────────────────────────────────────────────────────────────
function FailedBadge({ itemId, onRetry }: { itemId: string; onRetry: (id: string) => void }) {
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    onRetry(itemId)
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
        <span className="text-[10px] font-medium text-red-600">Failed</span>
      </div>
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="px-2 py-1 bg-white border border-ink-200 rounded-full text-[10px] font-medium text-ink-600 hover:bg-ink-50 hover:border-ink-300 disabled:opacity-50 transition-all"
      >
        {retrying ? '…' : '↻ Retry'}
      </button>
    </div>
  )
}

// ── Main DashboardClient ──────────────────────────────────────────────────────
export default function DashboardClient({ user, initialItems, initialConnections, stats, aiQueriesUsed = 0, aiQueryLimit = 10 }: Props) {
  const [items, setItems]       = useState<Item[]>(initialItems)
  const [connections]           = useState(initialConnections)
  const isFree  = user.plan === 'FREE'
  const aiAtLimit = isFree && aiQueriesUsed >= aiQueryLimit
  const [messages, setMessages] = useState<Message[]>([{
    role: 'ai',
    content: isFree
      ? `Hi${user.name ? ` ${user.name.split(' ')[0]}` : ''}! You have ${aiQueryLimit - aiQueriesUsed} AI queries left this month. Save items and ask me anything about them.`
      : `Hi${user.name ? ` ${user.name.split(' ')[0]}` : ''}! I've indexed all ${initialItems.filter(i => i.status === 'READY').length} of your saved items. Ask me anything.`
  }])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [filter, setFilter]     = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [streak, setStreak]     = useState(user.streak ?? 0)
  const [reviewDue, setReviewDue] = useState(0)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalItems = stats.reduce((s: number, g: any) => s + g._count, 0)
  const readyItems = items.filter(i => i.status === 'READY')

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Fetch streak info once
  useEffect(() => {
    fetch('/api/reminders/streak').then(r => r.json()).then(d => {
      if (d.streak    !== undefined) setStreak(d.streak)
      if (d.reviewsDue !== undefined) setReviewDue(d.reviewsDue)
    }).catch(() => {})
  }, [])

  // Smart polling: only poll when there are PROCESSING items; back-off to 8s after 30s
  useEffect(() => {
    const hasProcessing = items.some(i => i.status === 'PROCESSING')

    if (!hasProcessing) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }

    let elapsed = 0
    pollRef.current = setInterval(async () => {
      elapsed += 4000
      try {
        const res  = await fetch('/api/items')
        const data = await res.json()
        if (data.items) {
          setItems(data.items)
          if (!data.items.some((i: Item) => i.status === 'PROCESSING')) {
            clearInterval(pollRef.current!); pollRef.current = null
          }
        }
      } catch {}
    }, elapsed < 30_000 ? 4000 : 8000)

    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  }, [items])

  // Retry a failed item
  const retryItem = useCallback(async (id: string) => {
    // Optimistically show as PROCESSING
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'PROCESSING' as any } : i))
    try {
      const res = await fetch(`/api/items/${id}/retry`, { method: 'POST' })
      const data = await res.json()
      if (data.item) {
        setItems(prev => prev.map(i => i.id === id ? data.item : i))
        if (data.success) toast.success('Item processed successfully!')
        else toast.error('Processing failed again — check your AI key')
      }
    } catch {
      toast.error('Retry request failed')
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'FAILED' as any } : i))
    }
  }, [])

  const filteredItems = items.filter(item => {
    if (activeTag && !item.tags.includes(activeTag)) return false
    if (!filter) return true
    const q = filter.toLowerCase()
    return item.title.toLowerCase().includes(q)
      || (item.summary ?? '').toLowerCase().includes(q)
      || item.tags.some(t => t.toLowerCase().includes(q))
  })

  const allTags = Array.from(new Set(items.flatMap(i => i.tags))).slice(0, 16)

  async function sendMessage(text?: string) {
    const q = (text ?? input).trim()
    if (!q || loading) return

    // Block at limit without hitting API
    if (aiAtLimit) {
      toast.error(`Monthly AI limit reached (${aiQueryLimit} queries/month). Upgrade to Pro for unlimited.`)
      return
    }

    setInput('')
    setLoading(true)
    setMessages(m => [...m, { role: 'user', content: q }, { role: 'ai', content: '', loading: true }])
    try {
      const res  = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) })
      const data = await res.json()

      // Handle plan-gated 403
      if (res.status === 403 && data.upgrade) {
        setMessages(m => {
          const c = [...m]
          c[c.length - 1] = {
            role: 'ai',
            content: `You've reached your monthly AI query limit (${aiQueryLimit}/month on Free). Upgrade to Pro for unlimited queries.`,
          }
          return c
        })
        return
      }

      setMessages(m => { const c = [...m]; c[c.length-1] = { role: 'ai', content: data.answer ?? 'No answer found.' }; return c })
    } catch {
      setMessages(m => { const c = [...m]; c[c.length-1] = { role: 'ai', content: 'Something went wrong. Try again.' }; return c })
    } finally { setLoading(false) }
  }

  async function deleteItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    toast.success('Deleted')
  }

  async function toggleFavorite(id: string, current: boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: !current } : i))
    await fetch(`/api/items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isFavorite: !current }) })
  }

  async function shareItem(id: string, current: boolean) {
    const res  = await fetch(`/api/items/${id}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPublic: !current }) })
    const data = await res.json()
    setItems(prev => prev.map(i => i.id === id ? { ...i, isPublic: !current, publicSlug: data.slug } : i))
    if (!current && data.slug) {
      await navigator.clipboard.writeText(`${window.location.origin}/share/${data.slug}`)
      toast.success('Share link copied!')
    }
  }

  return (
    <div className="flex h-full">
      {/* ── Main panel ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-w-0 bg-[#f4f3ef]">
        <div className="p-5 space-y-4 max-w-5xl">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Items saved',    value: totalItems,         icon: '⊞' },
              { label: 'AI connections', value: connections.length, icon: '✦' },
              { label: 'Topics',         value: allTags.length,     icon: '◈' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="flex items-center justify-between mb-1">
                  <span className="stat-label">{s.label}</span>
                  <span className="text-ink-300 text-sm">{s.icon}</span>
                </div>
                <div className="stat-number">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Streak + Review */}
          {(streak > 0 || reviewDue > 0) && (
            <div className="flex gap-2.5 flex-wrap">
              {streak > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs font-medium text-amber-800">
                  <span>🔥</span><span>{streak}-day streak</span>
                </div>
              )}
              {reviewDue > 0 && (
                <Link href="/dashboard/reminders"
                  className="flex items-center gap-2 px-3.5 py-2 bg-violet-50 border border-violet-100 rounded-xl text-xs font-medium text-violet-800 hover:bg-violet-100 transition-colors">
                  <span>↻</span><span>{reviewDue} item{reviewDue !== 1 ? 's' : ''} to review</span>
                </Link>
              )}
            </div>
          )}

          {/* Quick add */}
          <div className="bg-white border border-ink-100 rounded-2xl px-5 py-4 flex items-center gap-4">
            <p className="text-sm text-ink-400 flex-1">What do you want to save today?</p>
            <div className="flex items-center gap-2">
              {[
                { l: 'URL',     h: '/dashboard/add?type=ARTICLE', c: 'text-blue-600 hover:bg-blue-50 border-blue-100' },
                { l: 'YouTube', h: '/dashboard/add?type=YOUTUBE', c: 'text-red-600 hover:bg-red-50 border-red-100' },
                { l: 'Note',    h: '/dashboard/add?type=NOTE',    c: 'text-violet-600 hover:bg-violet-50 border-violet-100' },
                { l: 'Voice',   h: '/dashboard/add?type=VOICE',   c: 'text-amber-600 hover:bg-amber-50 border-amber-100' },
              ].map(a => (
                <Link key={a.l} href={a.h} className={cn('quick-action', a.c)}>{a.l}</Link>
              ))}
            </div>
          </div>

          {/* Connections */}
          {connections.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">AI-found connections</span>
                <Link href="/dashboard/connections" className="text-xs text-violet-600 hover:text-violet-700">View all →</Link>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {connections.slice(0, 7).map((c: any) => (
                  <div key={c.id} className="conn-chip">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                    {truncate(c.title, 36)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium text-ink-500 uppercase tracking-wide shrink-0">
                {filter || activeTag ? `Results (${filteredItems.length})` : `Recent (${items.length})`}
              </span>
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter items…"
                className="flex-1 px-3 py-1.5 rounded-lg text-sm text-ink-700 placeholder-ink-400 outline-none transition-all search-input" />
              <Link href="/dashboard/add"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-ink-900 text-ink-50 rounded-lg text-xs font-medium hover:bg-ink-800 transition-colors shrink-0">
                + Add
              </Link>
            </div>

            {/* Tag pills */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {allTags.map(tag => (
                  <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={cn('tag-filter', activeTag === tag && 'active')}>
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {filteredItems.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-ink-100">
                <div className="text-4xl mb-3">🌱</div>
                <p className="text-ink-400 text-sm">
                  {items.length === 0 ? 'Save your first item to get started.' : 'No items match your filter.'}
                </p>
                {items.length === 0 && (
                  <Link href="/dashboard/add" className="mt-4 inline-block px-4 py-2 bg-ink-900 text-ink-50 rounded-lg text-sm">
                    Add your first item →
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map(item => (
                  <ItemCard
                    key={item.id} item={item}
                    onDelete={deleteItem}
                    onShare={shareItem}
                    onFavorite={toggleFavorite}
                    onRetry={retryItem}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upgrade nudge */}
          {user.plan === 'FREE' && items.length >= 35 && (
            <div className="upgrade-banner flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-violet-900">Using {items.length}/50 free items</p>
                <p className="text-xs text-violet-600 mt-0.5">Upgrade for unlimited items, AI queries, and weekly digests</p>
              </div>
              <Link href="/pricing" className="shrink-0 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700">
                Upgrade — $12/mo
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── AI Chat panel ──────────────────────────────────────── */}
      <aside className="hidden lg:flex w-80 xl:w-96 shrink-0 flex-col border-l border-ink-100 bg-white">
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full animate-pulse-soft', aiAtLimit ? 'bg-red-400' : 'bg-emerald-400')} />
            <span className="text-sm font-medium text-ink-800">Ask your knowledge base</span>
          </div>
          {isFree ? (
            <span className={cn('text-[10px] px-2 py-1 rounded-full font-medium',
              aiAtLimit ? 'text-red-600 bg-red-50' : 'text-ink-400 bg-ink-50')}>
              {aiQueryLimit - aiQueriesUsed}/{aiQueryLimit} queries
            </span>
          ) : (
            <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-1 rounded-full">
              {readyItems.length} indexed
            </span>
          )}
        </div>

        {/* FREE plan: AI limit banner */}
        {isFree && (
          <div className={cn('px-4 py-2 border-b text-xs',
            aiAtLimit
              ? 'bg-red-50 border-red-100 text-red-700'
              : 'bg-violet-50 border-violet-100 text-violet-700')}>
            {aiAtLimit ? (
              <span>Monthly limit reached. <Link href="/pricing" className="font-semibold underline">Upgrade to Pro</Link> for unlimited AI queries.</span>
            ) : (
              <span>{aiQueriesUsed} of {aiQueryLimit} free queries used this month. <Link href="/pricing" className="font-semibold underline">Upgrade</Link> for unlimited.</span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              msg.role === 'user' ? 'chat-bubble-user ml-6' : 'chat-bubble-ai'
            )}>
              {msg.loading ? (
                <div className="flex gap-1 items-center h-5">
                  {[0,1,2].map(j => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full bg-ink-300 animate-bounce"
                      style={{ animationDelay: `${j * 0.15}s` }} />
                  ))}
                </div>
              ) : msg.content}
            </div>
          ))}

          {messages.length === 1 && (
            <div className="pt-1 space-y-2">
              <p className="text-xs text-ink-400">Try asking:</p>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-ink-600 bg-ink-50 hover:bg-ink-100 border border-ink-100 hover:border-ink-200 transition-all leading-relaxed">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        <div className="p-4 border-t border-ink-100">
          {aiAtLimit ? (
            <div className="text-center py-2">
              <p className="text-xs text-red-500 mb-2">Monthly AI limit reached</p>
              <Link href="/pricing"
                className="inline-block w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
                Upgrade to Pro for unlimited →
              </Link>
            </div>
          ) : (
            <div className="flex gap-2 items-end">
              <textarea ref={inputRef} value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Ask anything about your notes…" rows={1}
                className="flex-1 text-sm px-3 py-2.5 bg-ink-50 border border-ink-100 rounded-xl resize-none outline-none focus:border-ink-300 focus:bg-white text-ink-800 placeholder-ink-400 max-h-28 overflow-y-auto"
                style={{ minHeight: '40px' }} />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-violet-500 text-white flex items-center justify-center hover:bg-violet-600 disabled:opacity-40 disabled:bg-ink-300 transition-all shrink-0">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 1L1 7l3.5 1.75M12 1L6 12 4.5 8.75M12 1L4.5 8.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

// ── ItemCard ──────────────────────────────────────────────────────────────────
function ItemCard({ item, onDelete, onShare, onFavorite, onRetry }: {
  item: Item
  onDelete:   (id: string) => void
  onShare:    (id: string, current: boolean) => void
  onFavorite: (id: string, current: boolean) => void
  onRetry:    (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const typeColor = TYPE_COLORS[item.type] ?? 'bg-ink-100 text-ink-600'
  const isFailed     = item.status === 'FAILED'
  const isProcessing = item.status === 'PROCESSING'

  return (
    <div className={cn(
      'item-card group relative',
      isFailed && 'border-red-100 bg-red-50/20'
    )} onMouseLeave={() => setMenuOpen(false)}>

      {/* Status badge — top right */}
      {isProcessing && (
        <div className="absolute top-3 right-3 z-10">
          <ProcessingBadge itemId={item.id} />
        </div>
      )}
      {isFailed && (
        <div className="absolute top-3 right-3 z-10">
          <FailedBadge itemId={item.id} onRetry={onRetry} />
        </div>
      )}

      {/* Type badge */}
      <div className="flex items-center gap-2 mb-3 pr-28">
        <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-md uppercase tracking-wide', typeColor)}>
          {getItemTypeLabel(item.type)}
        </span>
        {item.isFavorite && <span className="text-amber-400 text-xs">★</span>}
        {item.isPublic   && <span className="text-[10px] text-emerald-600 font-medium">Shared</span>}
      </div>

      {/* Title */}
      <h3 className={cn(
        'font-medium text-sm leading-snug mb-2 line-clamp-2',
        isFailed ? 'text-ink-400' : 'text-ink-900'
      )}>
        {item.title}
      </h3>

      {/* Content — hide for processing/failed */}
      {item.status === 'READY' && (
        <>
          {item.summary && (
            <p className="text-xs text-ink-500 leading-relaxed line-clamp-2 mb-3">{item.summary}</p>
          )}

          {item.keyInsights?.length > 0 && (
            <ul className="space-y-1 mb-3">
              {item.keyInsights.slice(0, 2).map((ins, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-ink-500">
                  <span className="text-violet-400 shrink-0 mt-0.5 text-[10px]">›</span>
                  <span className="line-clamp-1">{ins}</span>
                </li>
              ))}
            </ul>
          )}

          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ background: 'rgba(115,64,245,0.07)', color: '#534AB7' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* Processing placeholder content */}
      {isProcessing && (
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-ink-100 rounded animate-pulse" style={{ width: '85%' }} />
          <div className="h-3 bg-ink-100 rounded animate-pulse" style={{ width: '65%' }} />
          <div className="h-3 bg-ink-100 rounded animate-pulse" style={{ width: '75%' }} />
        </div>
      )}

      {/* Failed message */}
      {isFailed && (
        <p className="text-xs text-red-400 mb-3 leading-relaxed">
          AI processing failed. This can happen if the URL is paywalled or the AI service was unavailable. Click Retry to try again.
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-ink-50">
        <span className="text-[10px] text-ink-300">{formatRelative(item.createdAt)}</span>
        {item.status === 'READY' && (
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-ink-100 flex items-center justify-center text-ink-400 transition-all text-base font-bold">
              ···
            </button>
            {menuOpen && (
              <div className="absolute right-0 bottom-8 bg-white border border-ink-100 rounded-xl shadow-panel z-20 py-1 min-w-[160px] animate-fade-in">
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 text-xs text-ink-600 hover:bg-ink-50">
                    <span>↗</span> Open source
                  </a>
                )}
                <button onClick={() => { onFavorite(item.id, item.isFavorite ?? false); setMenuOpen(false) }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-ink-600 hover:bg-ink-50 w-full text-left">
                  <span>{item.isFavorite ? '☆' : '★'}</span> {item.isFavorite ? 'Unfavourite' : 'Favourite'}
                </button>
                <button onClick={() => { onShare(item.id, item.isPublic); setMenuOpen(false) }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-ink-600 hover:bg-ink-50 w-full text-left">
                  <span>⎘</span> {item.isPublic ? 'Unshare' : 'Share card'}
                </button>
                <div className="my-1 border-t border-ink-50" />
                <button onClick={() => { onDelete(item.id); setMenuOpen(false) }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-red-500 hover:bg-red-50 w-full text-left">
                  <span>✕</span> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
