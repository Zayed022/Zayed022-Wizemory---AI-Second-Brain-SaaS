'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type ItemType = 'ARTICLE' | 'NOTE' | 'VOICE' | 'PDF' | 'YOUTUBE'

const TYPES = [
  { type: 'ARTICLE' as ItemType, label: 'Article',      icon: '🔗', desc: 'Any web URL' },
  { type: 'YOUTUBE' as ItemType, label: 'YouTube',      icon: '▶️', desc: 'Video summary' },
  { type: 'NOTE'    as ItemType, label: 'Note',         icon: '📝', desc: 'Write freely' },
  { type: 'VOICE'   as ItemType, label: 'Voice',        icon: '🎙️', desc: 'Record audio' },
  { type: 'PDF'     as ItemType, label: 'PDF',          icon: '📄', desc: 'Upload file' },
]

export default function AddItemPage() {
  const router   = useRouter()
  const params   = useSearchParams()
  const [type, setType]           = useState<ItemType>((params.get('type') as ItemType) ?? 'ARTICLE')
  const [url, setUrl]             = useState('')
  const [title, setTitle]         = useState('')
  const [content, setContent]     = useState('')
  const [file, setFile]           = useState<File | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recording, setRecording] = useState(false)
  const [recorder, setRecorder]   = useState<MediaRecorder | null>(null)
  const [saving, setSaving]       = useState(false)

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks: Blob[] = []
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = () => { setAudioBlob(new Blob(chunks, { type: 'audio/webm' })); stream.getTracks().forEach(t => t.stop()) }
      mr.start(); setRecorder(mr); setRecording(true)
    } catch { toast.error('Microphone access denied') }
  }

  function stopRecording() { recorder?.stop(); setRecording(false) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if ((type === 'ARTICLE' || type === 'YOUTUBE') && !url) return toast.error('Paste a URL first')
    if (type === 'NOTE' && !content)    return toast.error('Write something first')
    if (type === 'PDF' && !file)        return toast.error('Select a PDF file')
    if (type === 'VOICE' && !audioBlob) return toast.error('Record something first')
    setSaving(true)
    try {
      if (type === 'YOUTUBE') {
        const res = await fetch('/api/youtube', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed') }
        toast.success('Video saved! AI is summarising it…'); router.push('/dashboard'); return
      }
      const form = new FormData()
      form.append('type', type)
      if (url)       form.append('url', url)
      if (title)     form.append('title', title)
      if (content)   form.append('content', content)
      if (file)      form.append('file', file)
      if (audioBlob) form.append('audio', audioBlob, 'memo.webm')
      const res = await fetch('/api/items', { method: 'POST', body: form })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed') }
      toast.success('Saved! AI is processing…'); router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong')
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-900 mb-1">Add to your knowledge base</h1>
        <p className="text-ink-400 text-sm">AI summarises, tags, and connects everything automatically.</p>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-8">
        {TYPES.map(t => (
          <button key={t.type} type="button" onClick={() => setType(t.type)}
            className={cn('flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all',
              type === t.type ? 'bg-ink-900 border-ink-900 text-ink-50' : 'bg-white border-ink-100 text-ink-500 hover:border-ink-200')}>
            <span className="text-xl">{t.icon}</span>
            <span className="text-[10px] font-medium leading-tight">{t.label}</span>
            <span className={cn('text-[9px]', type === t.type ? 'text-ink-400' : 'text-ink-300')}>{t.desc}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(type === 'ARTICLE' || type === 'YOUTUBE') && (
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">{type === 'YOUTUBE' ? 'YouTube URL' : 'Article URL'}</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} required
              placeholder={type === 'YOUTUBE' ? 'https://youtube.com/watch?v=...' : 'https://example.com/article...'}
              className="w-full px-4 py-3 bg-white border border-ink-200 rounded-xl text-sm text-ink-800 outline-none focus:border-violet-400 transition-colors" />
            <p className="mt-1.5 text-xs text-ink-400">{type === 'YOUTUBE' ? 'AI extracts key insights from the video transcript.' : 'We\'ll read the full article — not just the title.'}</p>
          </div>
        )}

        {type === 'NOTE' && (
          <>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Title (optional)</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quick thought on…"
                className="w-full px-4 py-3 bg-white border border-ink-200 rounded-xl text-sm text-ink-800 outline-none focus:border-violet-400 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} required rows={8}
                placeholder="Write your note, idea, or research here…"
                className="w-full px-4 py-3 bg-white border border-ink-200 rounded-xl text-sm text-ink-800 outline-none focus:border-violet-400 transition-colors resize-none leading-relaxed" />
            </div>
          </>
        )}

        {type === 'VOICE' && (
          <div className="text-center py-10">
            {audioBlob ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center text-3xl mx-auto">🎙️</div>
                <p className="text-sm font-medium text-ink-700">Recording ready!</p>
                <audio controls src={URL.createObjectURL(audioBlob)} className="mx-auto" />
                <button type="button" onClick={() => setAudioBlob(null)} className="text-xs text-ink-400 underline">Record again</button>
              </div>
            ) : (
              <div className="space-y-4">
                <button type="button" onClick={recording ? stopRecording : startRecording}
                  className={cn('w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto transition-all',
                    recording ? 'bg-red-100 animate-pulse-soft' : 'bg-ink-100 hover:bg-ink-200')}>
                  {recording ? '⏹' : '🎙️'}
                </button>
                <p className="text-sm text-ink-500">{recording ? '● Recording… tap to stop' : 'Tap to start recording'}</p>
              </div>
            )}
          </div>
        )}

        {type === 'PDF' && (
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">PDF file</label>
            <div className={cn('border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors',
                file ? 'border-sage-300 bg-sage-50' : 'border-ink-200 hover:border-ink-300')}
              onClick={() => document.getElementById('pdf-input')?.click()}>
              <input id="pdf-input" type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              {file ? (
                <div className="space-y-1"><div className="text-3xl">📄</div><div className="font-medium text-sm">{file.name}</div><div className="text-xs text-ink-400">{(file.size/1024).toFixed(0)} KB</div></div>
              ) : (
                <div className="space-y-1"><div className="text-3xl text-ink-300">📁</div><div className="text-sm text-ink-500">Drop a PDF or click to select</div><div className="text-xs text-ink-400">Max 10 MB</div></div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-ink-200 rounded-xl text-sm text-ink-600 hover:bg-ink-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-3 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 disabled:opacity-50 transition-all">
            {saving ? 'Saving…' : 'Save to WizeMory ✦'}
          </button>
        </div>
      </form>
    </div>
  )
}
