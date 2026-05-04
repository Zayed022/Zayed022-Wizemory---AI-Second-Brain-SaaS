export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import UpgradeGate from '@/components/ui/UpgradeGate'

export default async function DigestPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')

  if (user.plan === 'FREE') {
    return (
      <UpgradeGate
        icon="◇"
        feature="Weekly Digest"
        description="Every Monday, a personalised AI digest of your week — themes discovered, patterns identified, connections made, and one actionable nudge."
        bullets={[
          'AI synthesis of everything you saved that week',
          'Hidden pattern detection across your knowledge base',
          'Delivered to your inbox every Monday morning',
          'Stored in-app so you can revisit past digests',
        ]}
      />
    )
  }

  const digests = await prisma.weeklyDigest.findMany({
    where:   { userId: user.id },
    orderBy: { sentAt: 'desc' },
    take:    10,
  })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Weekly digests</h1>
          <p className="text-ink-400 text-sm mt-1">AI-generated summaries of your weekly learning</p>
        </div>
        <form action="/api/digest/generate" method="POST">
          <button type="submit"
            className="px-4 py-2 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 transition-colors">
            Generate now
          </button>
        </form>
      </div>

      {digests.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-5xl mb-4">◇</div>
          <h2 className="font-display text-2xl text-ink-700 mb-2">No digests yet</h2>
          <p className="text-ink-400 text-sm max-w-sm mx-auto">
            Digests are generated automatically every Monday. Save a few items and click "Generate now" to get your first one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {digests.map(d => (
            <div key={d.id} className="bg-white border border-ink-100 rounded-2xl p-6 card-hover">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-violet-500">◇</span>
                <span className="text-sm font-medium text-ink-700">
                  Week of {formatDate(d.weekStart)}
                </span>
                <span className="text-xs text-ink-300 ml-auto">{formatDate(d.sentAt)}</span>
              </div>
              <p className="text-sm text-ink-600 leading-relaxed prose-wizemory">{d.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}