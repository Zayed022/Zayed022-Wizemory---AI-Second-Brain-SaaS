'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function CoachClient({ userName, plan, streak }: { userName: string; plan: string; streak: number }) {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/coach').then(r => r.json()).then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const firstName = userName.split(' ')[0] || 'there'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-900">AI Memory Coach</h1>
          <p className="text-ink-400 text-sm mt-1">Your personalised daily learning brief</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl">
            <span className="text-xl">🔥</span>
            <div>
              <div className="text-sm font-medium text-amber-800">{streak}-day streak</div>
              <div className="text-xs text-amber-600">Keep it going!</div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* Daily greeting */}
          <div className="bg-ink-900 text-ink-50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm">🧠</div>
              <span className="text-xs text-ink-400 font-medium uppercase tracking-wide">Your daily brief</span>
            </div>
            <p className="text-lg font-medium leading-relaxed">{data?.coaching?.greeting}</p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-ink-100 rounded-2xl p-5">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Today's focus</div>
              <p className="text-sm text-ink-700 leading-relaxed">{data?.coaching?.focus}</p>
            </div>
            <div className="bg-white border border-ink-100 rounded-2xl p-5">
              <div className="text-2xl mb-2">💡</div>
              <div className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Pattern insight</div>
              <p className="text-sm text-ink-700 leading-relaxed">{data?.coaching?.insight}</p>
            </div>
            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-xs font-medium text-violet-500 uppercase tracking-wide mb-1">Best action</div>
              <p className="text-sm text-violet-900 leading-relaxed font-medium">{data?.coaching?.action}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">Knowledge gap</div>
              <p className="text-sm text-amber-900 leading-relaxed">{data?.coaching?.blindspot}</p>
            </div>
          </div>

          {/* Review due */}
          {data?.reviewItems?.length > 0 && (
            <div className="bg-white border border-ink-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium text-ink-900">Items due for review</h2>
                <Link href="/dashboard/reminders" className="text-xs text-violet-600 hover:text-violet-700">
                  Start reviewing →
                </Link>
              </div>
              <div className="space-y-2">
                {data.reviewItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 bg-ink-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                    <span className="text-sm text-ink-700 flex-1 truncate">{item.title}</span>
                    <span className="text-xs text-ink-400">{item.reviewCount}× reviewed</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {data?.topTopics?.length > 0 && (
            <div className="bg-white border border-ink-100 rounded-2xl p-5">
              <h2 className="font-medium text-ink-900 mb-3">Your core topics</h2>
              <div className="flex flex-wrap gap-2">
                {data.topTopics.map((t: string) => (
                  <span key={t} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-sm font-medium border border-violet-100">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex gap-3">
            <Link href="/dashboard/reminders" className="flex-1 py-3 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 transition-colors text-center">
              Open review queue →
            </Link>
            <Link href="/dashboard/add" className="flex-1 py-3 bg-white border border-ink-200 text-ink-700 rounded-xl text-sm font-medium hover:bg-ink-50 transition-colors text-center">
              + Save something new
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
