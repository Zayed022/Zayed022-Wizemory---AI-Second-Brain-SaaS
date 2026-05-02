import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-6">
      <div className="text-center">
        <div className="font-display text-8xl text-ink-200 mb-4">404</div>
        <h1 className="font-display text-3xl text-ink-900 mb-3">Page not found</h1>
        <p className="text-ink-400 mb-8">This page doesn't exist in your knowledge base.</p>
        <Link href="/" className="px-6 py-3 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 transition-colors">
          Go home →
        </Link>
      </div>
    </div>
  )
}
