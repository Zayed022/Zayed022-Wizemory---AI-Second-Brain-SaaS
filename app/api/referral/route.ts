export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

// Generate or get referral code
export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let { referralCode } = user
  if (!referralCode) {
    referralCode = nanoid(8).toLowerCase()
    await prisma.user.update({ where: { id: user.id }, data: { referralCode } })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wizemory.com'
  return NextResponse.json({
    code:     referralCode,
    url:      `${appUrl}/auth/sign-up?ref=${referralCode}`,
    count:    user.referralCount,
    reward:   user.referralCount >= 3 ? 'free_month' : null,
    progress: Math.min(user.referralCount, 3),
  })
}

// Register a referral
export async function POST(req: NextRequest) {
  const { code, newUserId } = await req.json()
  if (!code || !newUserId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const referrer = await prisma.user.findUnique({ where: { referralCode: code } })
  if (!referrer) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })

  await prisma.user.update({
    where: { id: newUserId },
    data:  { referredBy: referrer.id },
  })

  await prisma.user.update({
    where: { id: referrer.id },
    data:  { referralCount: { increment: 1 } },
  })

  // Reward: 3 successful referrals = 1 free month of Pro
  const updated = await prisma.user.findUnique({ where: { id: referrer.id } })
  if (updated?.referralCount === 3 && updated.plan === 'FREE') {
    // In production: trigger Stripe coupon or extend subscription
    console.log(`[referral] User ${referrer.id} earned free month for 3 referrals`)
  }

  return NextResponse.json({ success: true })
}
