'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ConnectionsClient({ connections, userId }: { connections: any[]; userId: string }) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState(connections)

  async function regenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/connections', { method: 'POST' })
      const data = await res.json()
      setItems(data.connections ?? [])
      toast.success(`Found ${data.connections?.length ?? 0} connections`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Connections</h1>
          <p className="text-ink-400 text-sm mt-1">Ideas WizeMory linked across your knowledge base</p>
        </div>
        <button onClick={regenerate} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 disabled:opacity-50 transition-all">
          {loading ? (
            <><span className="w-3 h-3 border border-ink-400 border-t-transparent rounded-full animate-spin" /> Finding…</>
          ) : (
            <><span>✦</span> Find connections</>
          )}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-5xl mb-4">✦</div>
          <h2 className="font-display text-2xl text-ink-700 mb-2">No connections yet</h2>
          <p className="text-ink-400 text-sm max-w-sm mx-auto mb-6">
            Save at least 5 items and click "Find connections" to let WizeMory discover hidden links.
          </p>
          <button onClick={regenerate}
            className="px-6 py-3 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 transition-colors">
            Find connections now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((conn: any) => (
            <div key={conn.id} className="bg-white border border-ink-100 rounded-2xl p-5 card-hover">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <span className="text-violet-600 text-sm">✦</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-ink-900 mb-1">{conn.title}</h3>
                  {conn.description && (
                    <p className="text-sm text-ink-500 leading-relaxed mb-3">{conn.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {conn.items?.map((ci: any) => (
                      <span key={ci.itemId}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-ink-50 border border-ink-100 rounded-full text-xs text-ink-600">
                        <span className="text-ink-300">◈</span>
                        {ci.item?.title?.slice(0, 35)}{ci.item?.title?.length > 35 ? '…' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-ink-400 mb-1">Strength</div>
                  <div className="font-mono text-sm text-violet-600">{Math.round(conn.strength * 100)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
