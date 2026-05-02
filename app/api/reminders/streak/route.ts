export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart  = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 6)

  const [todayCount, weekCount, totalCount, reviewsDue] = await Promise.all([
    prisma.item.count({ where: { userId: user.id, createdAt: { gte: todayStart } } }),
    prisma.item.count({ where: { userId: user.id, createdAt: { gte: weekStart } } }),
    prisma.item.count({ where: { userId: user.id, status: 'READY' } }),
    prisma.item.count({ where: { userId: user.id, status: 'READY', nextReviewAt: { lte: now } } }),
  ])

  // Update streak
  const lastActive = user.lastActiveAt
  const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / 86400000)
  let streak = user.streak

  if (daysSinceActive === 0) {
    // Already counted today
  } else if (daysSinceActive === 1) {
    streak += 1
    await prisma.user.update({ where: { id: user.id }, data: { streak, lastActiveAt: now } })
  } else {
    streak = 1 // broke streak
    await prisma.user.update({ where: { id: user.id }, data: { streak: 1, lastActiveAt: now } })
  }

  const badges = []
  if (totalCount >= 10)  badges.push({ id: 'explorer',  label: 'Explorer',   desc: 'Saved 10 items',        icon: '🗺️' })
  if (totalCount >= 50)  badges.push({ id: 'scholar',   label: 'Scholar',    desc: 'Saved 50 items',        icon: '📚' })
  if (totalCount >= 100) badges.push({ id: 'curator',   label: 'Curator',    desc: 'Saved 100 items',       icon: '🏛️' })
  if (streak >= 7)       badges.push({ id: 'streak7',   label: '7-day streak', desc: '7 days in a row',     icon: '🔥' })
  if (streak >= 30)      badges.push({ id: 'streak30',  label: '30-day streak',desc: 'A month of learning', icon: '⚡' })

  return NextResponse.json({ streak, todayCount, weekCount, totalCount, reviewsDue, badges })
}
