export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// SM-2 inspired: returns items due for review today
export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date()

  const dueItems = await prisma.item.findMany({
    where: {
      userId:      user.id,
      status:      'READY',
      nextReviewAt: { lte: now },
    },
    orderBy: { nextReviewAt: 'asc' },
    take: 10,
    select: { id: true, title: true, summary: true, keyInsights: true, tags: true, reviewCount: true, nextReviewAt: true },
  })

  // Also surface items never reviewed (up to 5)
  const neverReviewed = await prisma.item.findMany({
    where: { userId: user.id, status: 'READY', nextReviewAt: null, reviewCount: 0 },
    orderBy: { createdAt: 'asc' },
    take: 5,
    select: { id: true, title: true, summary: true, keyInsights: true, tags: true, reviewCount: true },
  })

  return NextResponse.json({ items: [...dueItems, ...neverReviewed] })
}

// Mark item as reviewed — schedule next review using SM-2 intervals
export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { itemId, quality } = await req.json() // quality: 0-5 (0=forgot, 5=perfect)
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

  const item = await prisma.item.findFirst({ where: { id: itemId, userId: user.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // SM-2 interval calculation
  const q = Math.max(0, Math.min(5, quality ?? 3))
  const n = item.reviewCount + 1
  let interval: number // days

  if (n === 1)      interval = 1
  else if (n === 2) interval = 6
  else {
    const prev = item.reviewCount
    const ef = Math.max(1.3, 2.5 + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    interval = Math.round(prev * ef)
  }

  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + interval)

  await prisma.item.update({
    where: { id: itemId },
    data:  { reviewCount: { increment: 1 }, nextReviewAt },
  })

  return NextResponse.json({ success: true, nextReviewAt, intervalDays: interval })
}
