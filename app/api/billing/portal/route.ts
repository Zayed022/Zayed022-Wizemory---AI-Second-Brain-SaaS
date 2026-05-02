export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey || stripeKey === 'sk_test_placeholder') {
    return NextResponse.json({ url: '/pricing', demo: true })
  }

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found. Subscribe first.' }, { status: 400 })
  }

  try {
    const Stripe  = (await import('stripe')).default
    const stripe  = new Stripe(stripeKey, { apiVersion: '2024-04-10' as any })
    const session = await stripe.billingPortal.sessions.create({
      customer:   user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[portal] Stripe error:', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Portal failed' }, { status: 500 })
  }
}
