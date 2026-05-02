export const dynamic = 'force-dynamic'

import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://wizemory.com').replace(/\/$/, '')

// Map plan+billing to Stripe price IDs from env
function getPriceId(planId: string, yearly: boolean): string | undefined {
  const map: Record<string, string | undefined> = {
    'pro-monthly':      process.env.STRIPE_PRO_PRICE_ID,
    'pro-yearly':       process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    'team-monthly':     process.env.STRIPE_TEAM_PRICE_ID,
    'team-yearly':      process.env.STRIPE_TEAM_YEARLY_PRICE_ID,
    'business-monthly': process.env.STRIPE_BUSINESS_PRICE_ID,
    'business-yearly':  process.env.STRIPE_BUSINESS_PRICE_ID,
  }
  const key = `${planId.toLowerCase()}-${yearly ? 'yearly' : 'monthly'}`
  return map[key]
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [clerkUser, user] = await Promise.all([
    currentUser(),
    prisma.user.findUnique({ where: { clerkId: userId } }),
  ])
  if (!user || !clerkUser) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { planId = 'pro', yearly = false } = await req.json()

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const priceId   = getPriceId(planId, yearly)

  // ── Demo / no-Stripe fallback ────────────────────────────────────────────
  if (!stripeKey || stripeKey === 'sk_test_placeholder' || !priceId) {
    console.log(`[checkout] Demo mode — no Stripe key or price for ${planId}/${yearly ? 'yearly' : 'monthly'}`)
    return NextResponse.json({
      url:  `${BASE}/pricing?demo=upgrade&plan=${planId}`,
      demo: true,
    })
  }

  // ── Real Stripe checkout ─────────────────────────────────────────────────
  try {
    const Stripe   = (await import('stripe')).default
    const stripe   = new Stripe(stripeKey, { apiVersion: '2024-04-10' as any })
    const email    = clerkUser.emailAddresses[0]?.emailAddress ?? ''

    // Get or create customer
    let customerId = user.stripeCustomerId ?? undefined
    if (!customerId) {
      const cust = await stripe.customers.create({
        email,
        metadata: { userId: user.id, clerkId: userId },
      })
      customerId = cust.id
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      payment_method_types: ['card'],
      line_items:           [{ price: priceId, quantity: 1 }],
      mode:                 'subscription',
      allow_promotion_codes: true,
      success_url:          `${BASE}/dashboard/settings?upgraded=1&plan=${planId}`,
      cancel_url:           `${BASE}/pricing`,
      metadata:             { userId: user.id, planId, yearly: String(yearly) },
    })

    console.log(`[checkout] Created session ${session.id} for user ${user.id} plan=${planId}`)
    return NextResponse.json({ url: session.url })

  } catch (err: any) {
    console.error('[checkout] Stripe error:', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Checkout failed' }, { status: 500 })
  }
}
