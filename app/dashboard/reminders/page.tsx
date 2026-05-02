export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ReviewQueueClient from '@/components/dashboard/ReviewQueueClient'

export default async function RemindersPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')

  const now = new Date()

  const [dueItems, stats] = await Promise.all([
    prisma.item.findMany({
      where: {
        userId:  user.id,
        status:  'READY',
        OR: [
          { nextReviewAt: { lte: now } },
          { nextReviewAt: null, reviewCount: 0 },
        ],
      },
      orderBy: { nextReviewAt: 'asc' },
      take: 15,
      select: { id: true, title: true, summary: true, keyInsights: true, tags: true, type: true, reviewCount: true, nextReviewAt: true, url: true },
    }),
    prisma.item.aggregate({
      where:  { userId: user.id, status: 'READY' },
      _count: true,
    }),
  ])

  return (
    <ReviewQueueClient
      dueItems={JSON.parse(JSON.stringify(dueItems))}
      totalItems={stats._count}
      streak={user.streak}
    />
  )
}
