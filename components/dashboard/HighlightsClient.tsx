'use client'
import { useState } from 'react'
import { formatRelative, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const COLORS: Record<string, string> = {
  yellow: 'bg-amber-100 border-amber-300 text-amber-900',
  green:  'bg-sage-100 border-sage-300 text-sage-900',
  blue:   'bg-blue-100 border-blue-300 text-blue-900',
  pink:   'bg-pink-100 border-pink-300 text-pink-900',
}

export default function HighlightsClient({ highlights: initial }: { highlights: any[] }) {
  const [highlights, setHighlights]   = useState(initial)
  const [filter, setFilter]           = useState<string>('all')
  const [searchQ, setSearchQ]         = useState('')

  const filtered = highlights.filter(h => {
    if (filter !== 'all' && h.color !== filter) return false
    if (searchQ && !h.text.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  })

  async function deleteHighlight(id: string) {
    setHighlights(prev => prev.filter(h => h.id !== id))
    await fetch('/api/highlights', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    toast.success('Highlight removed')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-900">Highlights</h1>
        <p className="text-ink-400 text-sm mt-1">Every passage you've marked across your knowledge base</p>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search highlights…"
          className="flex-1 min-w-[200px] px-3 py-2 bg-white border border-ink-100 rounded-xl text-sm outline-none focus:border-violet-400" />
        <div className="flex gap-1.5">
          {['all','yellow','green','blue','pink'].map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                filter === c ? 'bg-ink-900 text-ink-50' : 'bg-white border border-ink-100 text-ink-500 hover:border-ink-300')}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-5xl mb-4">✎</div>
          <h2 className="font-display text-2xl text-ink-700 mb-2">No highlights yet</h2>
          <p className="text-ink-400 text-sm max-w-sm mx-auto">
            When you read a saved article, select any text and save it as a highlight. Your best quotes live here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-ink-400">{filtered.length} highlight{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.map(h => (
            <div key={h.id} className={cn(
              'border rounded-2xl p-5 group relative',
              COLORS[h.color] || COLORS.yellow
            )}>
              <blockquote className="text-sm leading-relaxed mb-3 font-medium">"{h.text}"</blockquote>
              {h.note && <p className="text-xs opacity-75 italic mb-3">{h.note}</p>}
              <div className="flex items-center justify-between">
                <div className="text-xs opacity-60">
                  From: <span className="font-medium">{h.item?.title?.slice(0, 50)}{(h.item?.title?.length ?? 0) > 50 ? '…' : ''}</span>
                  <span className="ml-2">{formatRelative(h.createdAt)}</span>
                </div>
                <button onClick={() => deleteHighlight(h.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs underline transition-opacity">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
