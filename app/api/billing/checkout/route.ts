// app/api/billing/checkout/route.ts
export const dynamic = 'force-dynamic'

import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://wizemory.com').replace(/\/$/, '')

// Map plan+billing to Paddle price IDs from env
function getPriceId(planId: string, yearly: boolean): string | undefined {
  const map: Record<string, string | undefined> = {
    'pro-monthly':      process.env.PADDLE_PRO_PRICE_ID,
    'pro-yearly':       process.env.PADDLE_PRO_YEARLY_PRICE_ID,
    'team-monthly':     process.env.PADDLE_TEAM_PRICE_ID,
    'team-yearly':      process.env.PADDLE_TEAM_YEARLY_PRICE_ID,
    'business-monthly': process.env.PADDLE_BUSINESS_PRICE_ID,
    'business-yearly':  process.env.PADDLE_BUSINESS_YEARLY_PRICE_ID,
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

  const paddleKey = process.env.PADDLE_API_KEY
  const priceId   = getPriceId(planId, yearly)

  // ── Demo / no-Paddle fallback ────────────────────────────────────────────
  if (!paddleKey || paddleKey === 'test_placeholder' || !priceId) {
    console.log(`[checkout] Demo mode — no Paddle key or price for ${planId}/${yearly ? 'yearly' : 'monthly'}`)
    return NextResponse.json({
      url:  `${BASE}/pricing?demo=upgrade&plan=${planId}`,
      demo: true,
    })
  }

  // ── Real Paddle checkout ─────────────────────────────────────────────────
  try {
    const { Paddle, Environment } = await import('@paddle/paddle-node-sdk')

    const paddle = new Paddle(paddleKey, {
      environment: process.env.PADDLE_ENVIRONMENT === 'production'
        ? Environment.production
        : Environment.sandbox,
    })

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''

    // Get or create Paddle customer
    let paddleCustomerId = user.paddleCustomerId ?? undefined

    if (!paddleCustomerId) {
      let existing: any = null
      for await (const customer of paddle.customers.list({ email: [email] })) {
        existing = customer
        break
      }
    
      if (existing) {
        paddleCustomerId = existing.id
      } else {
        const created = await paddle.customers.create({
          email,
          name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || undefined,
        })
        paddleCustomerId = created.id
      }
    
      await prisma.user.update({
        where: { id: user.id },
        data:  { paddleCustomerId },
      })
    }
      

    // Create a Paddle transaction (generates a hosted checkout URL)
    const transaction = await paddle.transactions.create({
      items: [
        {
          priceId,
          quantity: 1,
        },
      ],
    
      customerId: paddleCustomerId,
    
      checkout: {
        url: `${BASE}/pricing`,
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en',
          successUrl: `${BASE}/dashboard/settings?upgraded=1&plan=${planId}`,
        },
      },
    
      customData: {
        userId: user.id,
        planId,
        yearly: String(yearly),
      },
    })

    const checkoutUrl = transaction.checkout?.url
    console.log(transaction)
console.log('Checkout URL:', checkoutUrl)
    if (!checkoutUrl) throw new Error('Paddle did not return a checkout URL')

    console.log(`[checkout] Created transaction ${transaction.id} for user ${user.id} plan=${planId}`)
    return NextResponse.json({
      url: checkoutUrl,
      transactionId: transaction.id,
    })

  } catch (err: any) {
    console.error('[checkout] Paddle error:', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Checkout failed' }, { status: 500 })
  }
}