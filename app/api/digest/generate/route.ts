import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWeeklyDigest } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)

  const items = await prisma.item.findMany({
    where: { userId: user.id, status: 'READY', createdAt: { gte: weekStart } },
    select: { title: true, summary: true, tags: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  if (items.length === 0) {
    return NextResponse.json({ message: 'No items this week' }, { status: 200 })
  }

  const content = await generateWeeklyDigest(items, user.name ?? 'there')

  const digest = await prisma.weeklyDigest.create({
    data: {
      userId: user.id,
      content,
      weekStart,
    },
  })

  return NextResponse.json({ digest })
}
