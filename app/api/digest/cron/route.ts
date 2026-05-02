export const dynamic    = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWeeklyDigest } from '@/lib/ai'
import { sendWeeklyDigestEmail, sendReviewReminderEmail, sendStreakReminderEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET ?? 'dev-secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const task = new URL(req.url).searchParams.get('task') ?? 'digest'

  if (task === 'digest')  return runWeeklyDigest()
  if (task === 'review')  return runReviewReminders()
  if (task === 'streak')  return runStreakReminders()

  return NextResponse.json({ error: 'Unknown task' }, { status: 400 })
}

async function runWeeklyDigest() {
  const proUsers = await prisma.user.findMany({
    where:  { plan: { in: ['PRO', 'TEAM', 'BUSINESS'] } },
    select: { id: true, name: true, email: true, streak: true },
  })

  const weekStart = new Date(Date.now() - 7 * 86400000)
  let processed = 0

  for (const user of proUsers) {
    try {
      const raw = await prisma.item.findMany({
        where:   { userId: user.id, status: 'READY', createdAt: { gte: weekStart } },
        select:  { title: true, summary: true, tags: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
      if (raw.length === 0) continue

      const items   = raw.map(i => ({ ...i, summary: i.summary ?? '' }))
      const content = await generateWeeklyDigest(items, user.name ?? 'there')

      await prisma.weeklyDigest.create({ data: { userId: user.id, content, weekStart } })
      await sendWeeklyDigestEmail(user.email, user.name ?? '', content, items.length, user.streak)
      processed++
      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      console.error(`[cron/digest] ${user.id}:`, err)
    }
  }

  return NextResponse.json({ task: 'digest', processed, total: proUsers.length })
}

async function runReviewReminders() {
  const now = new Date()
  const proUsers = await prisma.user.findMany({
    where:  { plan: { in: ['PRO', 'TEAM', 'BUSINESS'] } },
    select: { id: true, name: true, email: true },
  })

  let sent = 0
  for (const user of proUsers) {
    try {
      const dueCount = await prisma.item.count({
        where: { userId: user.id, status: 'READY', nextReviewAt: { lte: now } },
      })
      if (dueCount < 3) continue
      await sendReviewReminderEmail(user.email, user.name ?? '', dueCount)
      sent++
      await new Promise(r => setTimeout(r, 200))
    } catch (err) {
      console.error(`[cron/review] ${user.id}:`, err)
    }
  }

  return NextResponse.json({ task: 'review', sent, total: proUsers.length })
}

async function runStreakReminders() {
  const threshold = new Date(Date.now() - 20 * 3600000)

  const atRisk = await prisma.user.findMany({
    where: {
      streak:       { gt: 2 },
      lastActiveAt: { lte: threshold },
      plan:         { in: ['PRO', 'TEAM', 'BUSINESS'] },
    },
    select: { id: true, name: true, email: true, streak: true },
  })

  let sent = 0
  for (const user of atRisk) {
    try {
      await sendStreakReminderEmail(user.email, user.name ?? '', user.streak)
      sent++
      await new Promise(r => setTimeout(r, 200))
    } catch (err) {
      console.error(`[cron/streak] ${user.id}:`, err)
    }
  }

  return NextResponse.json({ task: 'streak', sent, total: atRisk.length })
}
