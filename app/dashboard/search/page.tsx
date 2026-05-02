'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatRelative, getItemTypeIcon, getItemTypeLabel } from '@/lib/utils'
import type { Item } from '@/types'

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(search, 300)
    return () => clearTimeout(t)
  }, [query])

  async function search() {
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.items ?? [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="relative mb-8">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="5.5"/>
          <path d="M13 13L17 17" strokeLinecap="round"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && router.back()}
          placeholder="Search your knowledge base…"
          className="w-full pl-12 pr-4 py-4 bg-white border border-ink-200 rounded-2xl text-base text-ink-800 outline-none focus:border-violet-400 transition-colors"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border border-ink-300 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {results.length === 0 && query && !loading && (
        <div className="text-center py-12">
          <p className="text-ink-400">No results for <strong className="text-ink-700">"{query}"</strong></p>
          <p className="text-ink-300 text-sm mt-1">Try different keywords, or ask the AI instead</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-ink-400">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {results.map(item => (
            <div key={item.id} className="bg-white border border-ink-100 rounded-2xl p-5 card-hover cursor-pointer"
              onClick={() => router.push(`/dashboard?highlight=${item.id}`)}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{getItemTypeIcon(item.type)}</span>
                <span className="text-xs text-ink-400">{getItemTypeLabel(item.type)}</span>
                <span className="ml-auto text-xs text-ink-300">{formatRelative(item.createdAt)}</span>
              </div>
              <h3 className="font-medium text-ink-900 mb-1 text-sm">{item.title}</h3>
              {item.summary && <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">{item.summary}</p>}
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {item.tags.slice(0, 4).map(t => (
                  <span key={t} className="px-2 py-0.5 bg-ink-50 text-ink-500 rounded-full text-[10px] border border-ink-100">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!query && (
        <div className="text-center py-12">
          <p className="text-ink-300 text-sm">Start typing to search · Press Esc to close</p>
        </div>
      )}
    </div>
  )
}
