import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60)
}

export function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10)
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

export function formatRelative(date: Date | string): string {
  const d    = new Date(date)
  const diff = Date.now() - d.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return formatDate(d)
}

export function getItemTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    ARTICLE: '📰', NOTE: '📝', VOICE: '🎙️', PDF: '📄',
    SCREENSHOT: '🖼️', BOOKMARK: '🔖', YOUTUBE: '▶️', PODCAST: '🎧',
  }
  return icons[type] ?? '📌'
}

export function getItemTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ARTICLE: 'Article', NOTE: 'Note', VOICE: 'Voice memo', PDF: 'PDF',
    SCREENSHOT: 'Screenshot', BOOKMARK: 'Bookmark', YOUTUBE: 'YouTube', PODCAST: 'Podcast',
  }
  return labels[type] ?? type
}

export function getTagColor(tag: string): string {
  const map: Record<string, string> = {
    'ai': 'bg-violet-100 text-violet-800', 'productivity': 'bg-sage-100 text-sage-800',
    'health': 'bg-green-100 text-green-800', 'finance': 'bg-amber-50 text-amber-600',
    'psychology': 'bg-pink-100 text-pink-800', 'design': 'bg-sky-100 text-sky-800',
    'startup': 'bg-orange-100 text-orange-800', 'learning': 'bg-blue-100 text-blue-800',
    'science': 'bg-teal-100 text-teal-800', 'business': 'bg-amber-100 text-amber-800',
  }
  return map[tag.toLowerCase()] ?? 'bg-ink-100 text-ink-600'
}
