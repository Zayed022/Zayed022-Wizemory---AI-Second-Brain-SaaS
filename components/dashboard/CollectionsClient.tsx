'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const EMOJIS = ['📚','📁','🧠','💡','🔬','💼','🎯','✨','🌍','❤️','🎨','🔧']
const COLORS = ['#7340f5','#1D9E75','#d97706','#e85d24','#be185d','#0ea5e9','#64748b']

export default function CollectionsClient({ collections: initial }: { collections: any[] }) {
  const [collections, setCollections] = useState(initial)
  const [showNew, setShowNew]         = useState(false)
  const [name, setName]               = useState('')
  const [desc, setDesc]               = useState('')
  const [emoji, setEmoji]             = useState('📚')
  const [color, setColor]             = useState('#7340f5')
  const [saving, setSaving]           = useState(false)

  async function createCollection() {
    if (!name.trim()) return toast.error('Give your collection a name')
    setSaving(true)
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: desc, emoji, color }),
      })
      const data = await res.json()
      setCollections(prev => [data.collection, ...prev])
      setShowNew(false); setName(''); setDesc('')
      toast.success('Collection created!')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Collections</h1>
          <p className="text-ink-400 text-sm mt-1">Organise your knowledge into themed folders</p>
        </div>
        <button onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-1.5 px-4 py-2 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 transition-colors">
          + New collection
        </button>
      </div>

      {/* New collection form */}
      {showNew && (
        <div className="bg-white border border-ink-100 rounded-2xl p-6 mb-8 space-y-4">
          <h2 className="font-medium text-ink-900">Create collection</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-ink-500 mb-1.5">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AI research"
                className="w-full px-3 py-2.5 bg-ink-50 border border-ink-100 rounded-xl text-sm outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="block text-xs text-ink-500 mb-1.5">Description (optional)</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's in this collection?"
                className="w-full px-3 py-2.5 bg-ink-50 border border-ink-100 rounded-xl text-sm outline-none focus:border-violet-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={cn('w-9 h-9 rounded-xl text-lg transition-all', emoji === e ? 'bg-violet-100 ring-2 ring-violet-400' : 'bg-ink-50 hover:bg-ink-100')}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-2">Colour</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn('w-7 h-7 rounded-full transition-all', color === c ? 'ring-2 ring-offset-2 ring-ink-400' : '')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowNew(false)}
              className="px-4 py-2 border border-ink-200 text-ink-600 rounded-xl text-sm hover:bg-ink-50 transition-colors">
              Cancel
            </button>
            <button onClick={createCollection} disabled={saving}
              className="px-6 py-2 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 disabled:opacity-50 transition-colors">
              {saving ? 'Creating…' : 'Create collection'}
            </button>
          </div>
        </div>
      )}

      {/* Collections grid */}
      {collections.length === 0 && !showNew ? (
        <div className="py-20 text-center">
          <div className="text-5xl mb-4">❑</div>
          <h2 className="font-display text-2xl text-ink-700 mb-2">No collections yet</h2>
          <p className="text-ink-400 text-sm max-w-sm mx-auto mb-6">Group your saved items by topic, project, or any theme you like.</p>
          <button onClick={() => setShowNew(true)}
            className="px-6 py-3 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 transition-colors">
            Create your first collection
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col: any) => (
            <div key={col.id} className="bg-white border border-ink-100 rounded-2xl p-5 card-hover cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: col.color + '20' }}>
                  {col.emoji}
                </div>
                <span className="text-xs text-ink-400">{col.itemCount} items</span>
              </div>
              <h3 className="font-medium text-ink-900 mb-1">{col.name}</h3>
              {col.description && <p className="text-xs text-ink-500 line-clamp-2 mb-3">{col.description}</p>}
              {col.items?.length > 0 && (
                <div className="space-y-1 mt-3 pt-3 border-t border-ink-50">
                  {col.items.slice(0, 3).map((ci: any) => (
                    <div key={ci.itemId} className="text-xs text-ink-500 truncate flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-ink-300 shrink-0" />
                      {ci.item?.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
