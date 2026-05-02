import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDate, getItemTypeIcon, getItemTypeLabel } from '@/lib/utils'
import type { Metadata } from 'next'
import Link from 'next/link'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await prisma.item.findUnique({
    where: { publicSlug: params.slug, isPublic: true },
  })
  if (!item) return { title: 'Not found' }
  return {
    title: item.title,
    description: item.summary ?? undefined,
    openGraph: {
      title: `${item.title} | WizeMory`,
      description: item.summary ?? undefined,
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title: item.title, description: item.summary ?? undefined },
  }
}

export default async function SharePage({ params }: Props) {
  const item = await prisma.item.findUnique({
    where: { publicSlug: params.slug, isPublic: true },
    include: { user: { select: { name: true } } },
  })

  if (!item) notFound()

  // Increment view count
  await prisma.item.update({
    where: { id: item.id },
    data: { viewCount: { increment: 1 } },
  })

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      {/* Minimal nav */}
      <nav className="border-b border-ink-100 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-ink-900">
          Wize<span className="text-violet-500">Mory</span>
        </Link>
        <Link
          href="/auth/sign-up"
          className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
        >
          Save to your WizeMory →
        </Link>
      </nav>

      <main className="flex-1 flex items-start justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          {/* Card */}
          <article className="bg-white border border-ink-100 rounded-3xl overflow-hidden shadow-sm">
            {/* Header stripe */}
            <div className="h-1.5 bg-gradient-to-r from-violet-400 via-violet-500 to-sage-400" />

            <div className="p-8 md:p-10">
              {/* Meta */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">{getItemTypeIcon(item.type)}</span>
                <span className="text-xs text-ink-400 font-medium">{getItemTypeLabel(item.type)}</span>
                {item.url && (
                  <>
                    <span className="text-ink-200">·</span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-ink-400 hover:text-violet-600 transition-colors truncate max-w-[200px]"
                    >
                      {new URL(item.url).hostname}
                    </a>
                  </>
                )}
                <span className="ml-auto text-xs text-ink-300">{formatDate(item.createdAt)}</span>
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl md:text-4xl text-ink-900 leading-tight mb-6">
                {item.title}
              </h1>

              {/* Summary */}
              {item.summary && (
                <div className="bg-ink-50 rounded-2xl p-5 mb-6">
                  <div className="text-xs font-medium text-ink-400 mb-2 uppercase tracking-wide">AI Summary</div>
                  <p className="text-ink-700 leading-relaxed">{item.summary}</p>
                </div>
              )}

              {/* Key insights */}
              {item.keyInsights.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-medium text-ink-400 mb-3 uppercase tracking-wide">Key insights</div>
                  <ul className="space-y-2.5">
                    {item.keyInsights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-ink-700 text-sm leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-ink-100 text-ink-600 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="pt-6 border-t border-ink-100 flex items-center justify-between">
                <div className="text-xs text-ink-400">
                  {item.user.name ? `Saved by ${item.user.name}` : 'Shared via WizeMory'}
                  {item.viewCount > 1 && ` · ${item.viewCount} views`}
                </div>
                <Link
                  href="/auth/sign-up"
                  className="flex items-center gap-1.5 px-4 py-2 bg-ink-900 text-ink-50 rounded-xl text-xs font-medium hover:bg-ink-800 transition-colors"
                >
                  <span>✦</span> Build your second brain
                </Link>
              </div>
            </div>
          </article>

          {/* Social share buttons */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-xs text-ink-400">Share this card:</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${item.title}" — saved to my WizeMory`)}&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/share/${params.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition-colors"
            >
              𝕏 Twitter
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/share/${params.slug}`)}
              className="px-3 py-1.5 bg-white border border-ink-200 text-ink-600 rounded-lg text-xs font-medium hover:bg-ink-50 transition-colors"
            >
              Copy link
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
