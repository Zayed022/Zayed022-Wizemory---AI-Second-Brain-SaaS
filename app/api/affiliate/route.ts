export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!user.referralCode) {
    user = await prisma.user.update({ where: { id: user.id }, data: { referralCode: Math.random().toString(36).substring(2, 10) } })
  }

  const payouts = await prisma.affiliatePayout.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 20 })

  const totalEarned     = payouts.reduce((s, p) => s + p.amount, 0)
  const pendingPayouts  = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const paidOut         = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const appUrl          = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wizemory.com'

  return NextResponse.json({
    code:          user.referralCode,
    referralUrl:   `${appUrl}/auth/sign-up?ref=${user.referralCode}`,
    referralCount: user.referralCount,
    totalEarned,
    pendingPayouts,
    paidOut,
    payouts,
    commission:    30,
    progress:      Math.min(user.referralCount, 3),
    freeMonthsEarned: Math.floor(user.referralCount / 3),
  })
}
