export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now     = new Date()
  const week    = new Date(now.getTime() - 7 * 86400000)
  const month   = new Date(now.getTime() - 30 * 86400000)

  const [total, ready, thisWeek, thisMonth, typeBreakdown, tagCounts, topTags] = await Promise.all([
    prisma.item.count({ where: { userId: user.id } }),
    prisma.item.count({ where: { userId: user.id, status: 'READY' } }),
    prisma.item.count({ where: { userId: user.id, createdAt: { gte: week } } }),
    prisma.item.count({ where: { userId: user.id, createdAt: { gte: month } } }),
    prisma.item.groupBy({ by: ['type'], where: { userId: user.id }, _count: true }),
    prisma.item.findMany({ where: { userId: user.id, status: 'READY' }, select: { tags: true }, take: 200 }),
    prisma.item.findMany({ where: { userId: user.id, status: 'READY' }, select: { tags: true }, take: 200 }),
  ])

  // Tag frequency
  const tagFreq: Record<string, number> = {}
  tagCounts.forEach(i => i.tags.forEach(t => { tagFreq[t] = (tagFreq[t] ?? 0) + 1 }))
  const topTopics = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Growth by week (last 8 weeks)
  const weeklyGrowth: { week: string; count: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now.getTime() - (i + 1) * 7 * 86400000)
    const end   = new Date(now.getTime() - i * 7 * 86400000)
    const count = await prisma.item.count({ where: { userId: user.id, createdAt: { gte: start, lt: end } } })
    weeklyGrowth.push({ week: `W${8 - i}`, count })
  }

  // Estimated hours saved (avg 8 min to read + process an article, WizeMory takes 20 sec)
  const hoursSaved = Math.round((ready * 7.67) / 60 * 10) / 10

  // Knowledge score (composite metric)
  const knowledgeScore = Math.min(
    Math.round(ready * 2 + user.streak * 5 + user.referralCount * 10 + (topTopics.length * 3)),
    999
  )

  return NextResponse.json({
    total,
    ready,
    thisWeek,
    thisMonth,
    hoursSaved,
    knowledgeScore,
    streak:      user.streak,
    longestStreak: user.streak,
    typeBreakdown: typeBreakdown.map(t => ({ type: t.type, count: t._count })),
    topTopics:   topTopics.map(([topic, count]) => ({ topic, count })),
    weeklyGrowth,
    memberSince: user.createdAt,
    plan:        user.plan,
  })
}
