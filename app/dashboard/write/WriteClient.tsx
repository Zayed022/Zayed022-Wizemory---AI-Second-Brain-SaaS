'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const FORMATS = [
  { id: 'twitter_thread',   label: 'Twitter thread',    icon: '𝕏',  desc: 'Hook + insights + CTA' },
  { id: 'blog_post',        label: 'Blog post',          icon: '✍️', desc: '600-800 words, SEO-ready' },
  { id: 'linkedin_post',    label: 'LinkedIn post',      icon: 'in', desc: 'Professional, engaging' },
  { id: 'email_newsletter', label: 'Newsletter section', icon: '✉️', desc: 'Subscriber-ready copy' },
  { id: 'summary_doc',      label: 'Summary doc',        icon: '📄', desc: 'Structured markdown' },
  { id: 'study_notes',      label: 'Study notes',        icon: '📚', desc: 'Learn & retain' },
]

export default function WriteClient() {
  const [topic, setTopic]   = useState('')
  const [format, setFormat] = useState('twitter_thread')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [usedItems, setUsedItems] = useState(0)

  async function generate() {
    if (!topic.trim()) return toast.error('Enter a topic first')
    setLoading(true); setResult('')
    try {
      const res  = await fetch('/api/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: topic.trim(), format }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Generation failed'); return }
      setResult(data.result ?? ''); setUsedItems(data.itemsUsed ?? 0)
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  async function copyResult() {
    await navigator.clipboard.writeText(result)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast.success('Copied!')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-900 mb-1">AI Writing Assistant</h1>
        <p className="text-ink-400 text-sm">Generate content using your own saved knowledge as the source.</p>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Topic or question</label>
        <input value={topic} onChange={e => setTopic(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') generate() }}
          placeholder="e.g. What I've learned about building habits, AI and the future of work…"
          className="w-full px-4 py-3 bg-white border border-ink-200 rounded-xl text-sm text-ink-800 outline-none focus:border-violet-400 transition-colors" />
      </div>

      <div className="mb-5">
        <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Output format</label>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map(f => (
            <button key={f.id} onClick={() => setFormat(f.id)}
              className={cn('p-3 rounded-xl border text-left transition-all',
                format === f.id ? 'border-violet-300 bg-violet-50' : 'border-ink-100 bg-white hover:border-ink-200')}>
              <div className="text-base mb-1">{f.icon}</div>
              <div className="text-xs font-medium text-ink-900">{f.label}</div>
              <div className="text-[10px] text-ink-400">{f.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={generate} disabled={loading || !topic.trim()}
        className="w-full py-3.5 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mb-6">
        {loading ? (<><div className="w-4 h-4 border-2 border-ink-400 border-t-ink-50 rounded-full animate-spin"/>Generating…</>) : '✦ Generate'}
      </button>

      {result && (
        <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden animate-fade-in">
          <div className="px-5 py-3 border-b border-ink-50 flex items-center justify-between">
            <span className="text-xs text-ink-500 font-medium">
              {FORMATS.find(f => f.id === format)?.label} · Based on {usedItems} saved item{usedItems !== 1 ? 's' : ''}
            </span>
            <button onClick={copyResult}
              className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all', copied ? 'bg-emerald-500 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200')}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="p-5">
            <pre className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed font-sans">{result}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
