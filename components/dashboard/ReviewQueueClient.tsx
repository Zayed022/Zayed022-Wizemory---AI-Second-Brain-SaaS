'use client'
import { useState } from 'react'
import { cn, getItemTypeIcon } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ReviewItem {
  id: string; title: string; summary: string | null; keyInsights: string[]
  tags: string[]; type: string; reviewCount: number; url: string | null
}

export default function ReviewQueueClient({
  dueItems: initial, totalItems, streak
}: { dueItems: ReviewItem[]; totalItems: number; streak: number }) {
  const [items, setItems]     = useState(initial)
  const [current, setCurrent] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone]       = useState(false)

  const item = items[current]

  async function grade(quality: number) {
    if (!item) return
    try {
      await fetch('/api/reminders/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, quality }),
      })
    } catch {}

    if (current + 1 >= items.length) {
      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setRevealed(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-900">Review queue</h1>
          <p className="text-ink-400 text-sm mt-1">Spaced repetition keeps your knowledge fresh</p>
        </div>
        <div className="bg-white border border-ink-100 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="font-display text-2xl text-ink-700 mb-2">All caught up!</h2>
          <p className="text-ink-400 text-sm max-w-sm mx-auto">
            No items due for review right now. Save more articles and come back tomorrow — WizeMory will resurface the ones you need to revisit.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl text-sm text-amber-700">
            🔥 {streak} day streak · {totalItems} total items
          </div>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white border border-ink-100 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="font-display text-3xl text-ink-900 mb-3">Session complete!</h2>
          <p className="text-ink-500 mb-6">You reviewed {items.length} item{items.length !== 1 ? 's' : ''}. Great work.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setDone(false); setCurrent(0); setRevealed(false) }}
              className="px-5 py-2.5 border border-ink-200 text-ink-700 rounded-xl text-sm hover:bg-ink-50 transition-colors">
              Review again
            </button>
            <a href="/dashboard" className="px-5 py-2.5 bg-ink-900 text-ink-50 rounded-xl text-sm hover:bg-ink-800 transition-colors">
              Back to dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Review queue</h1>
          <p className="text-ink-400 text-sm mt-0.5">
            {current + 1} of {items.length} · 🔥 {streak} day streak
          </p>
        </div>
        <div className="text-sm text-ink-400">
          {Math.round(((current) / items.length) * 100)}% done
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-ink-100 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-violet-400 rounded-full transition-all"
          style={{ width: `${(current / items.length) * 100}%` }} />
      </div>

      {/* Card */}
      <div className="bg-white border border-ink-100 rounded-2xl p-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">{getItemTypeIcon(item.type)}</span>
          <div className="flex gap-1.5">
            {item.tags.slice(0, 3).map(t => (
              <span key={t} className="px-2 py-0.5 bg-ink-50 text-ink-500 rounded-full text-xs border border-ink-100">{t}</span>
            ))}
          </div>
          <span className="ml-auto text-xs text-ink-400">Reviewed {item.reviewCount}×</span>
        </div>

        <h2 className="font-display text-2xl text-ink-900 mb-4 leading-tight">{item.title}</h2>

        {!revealed ? (
          <button onClick={() => setRevealed(true)}
            className="w-full py-3 border-2 border-dashed border-ink-200 rounded-xl text-sm text-ink-400 hover:border-violet-300 hover:text-violet-600 transition-all">
            Show summary & insights →
          </button>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {item.summary && (
              <p className="text-ink-600 leading-relaxed text-sm">{item.summary}</p>
            )}
            {item.keyInsights.length > 0 && (
              <ul className="space-y-2">
                {item.keyInsights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-600">
                    <span className="text-violet-400 shrink-0 mt-0.5">›</span>
                    {ins}
                  </li>
                ))}
              </ul>
            )}
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="inline-block text-xs text-violet-600 hover:text-violet-700 transition-colors">
                Read original →
              </a>
            )}
          </div>
        )}
      </div>

      {/* Grading buttons */}
      {revealed && (
        <div>
          <p className="text-xs text-ink-400 text-center mb-3">How well did you remember this?</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Forgot',  q: 0, color: 'border-red-200 text-red-600 hover:bg-red-50' },
              { label: 'Hard',    q: 2, color: 'border-amber-200 text-amber-600 hover:bg-amber-50' },
              { label: 'Good',    q: 4, color: 'border-sage-200 text-sage-700 hover:bg-sage-50' },
              { label: 'Perfect', q: 5, color: 'border-violet-200 text-violet-600 hover:bg-violet-50' },
            ].map(g => (
              <button key={g.label} onClick={() => grade(g.q)}
                className={cn('py-3 border rounded-xl text-sm font-medium transition-all', g.color)}>
                {g.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-300 text-center mt-3">Your rating schedules when this appears next</p>
        </div>
      )}

      {!revealed && (
        <button onClick={() => grade(3)}
          className="w-full py-3 border border-ink-200 text-ink-500 rounded-xl text-sm hover:bg-ink-50 transition-colors">
          Skip for now
        </button>
      )}
    </div>
  )
}
