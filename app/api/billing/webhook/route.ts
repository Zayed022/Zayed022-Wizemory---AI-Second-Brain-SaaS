export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendUpgradeConfirmationEmail } from '@/lib/email'

const PLAN_MAP: Record<string, string> = {
  pro:      'PRO',
  team:     'TEAM',
  business: 'BUSINESS',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey || stripeKey === 'sk_test_placeholder') {
    return NextResponse.json({ received: true, note: 'Stripe not configured' })
  }

  let event: any
  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as any })
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err?.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  console.log(`[webhook] Event: ${event.type}`)

  try {
    switch (event.type) {

      // ── Checkout completed → activate subscription ───────────────────
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId  = session.metadata?.userId
        const planId  = (session.metadata?.planId ?? 'pro').toLowerCase()
        const subId   = session.subscription as string

        if (!userId) { console.error('[webhook] No userId in metadata'); break }

        const plan = PLAN_MAP[planId] ?? 'PRO'
        const user = await prisma.user.update({
          where: { id: userId },
          data:  { plan: plan as any, stripeSubscriptionId: subId },
        })
        console.log(`[webhook] Activated ${plan} for user ${userId}`)
        await sendUpgradeConfirmationEmail(user.email, user.name ?? '', plan).catch(() => {})
        break
      }

      // ── Subscription updated (plan change, renewal) ──────────────────
      case 'customer.subscription.updated': {
        const sub      = event.data.object
        const userId   = sub.metadata?.userId
        const planId   = (sub.metadata?.planId ?? 'pro').toLowerCase()
        const status   = sub.status // 'active' | 'past_due' | 'canceled' | etc.

        if (!userId) break

        if (status === 'active' || status === 'trialing') {
          const plan = PLAN_MAP[planId] ?? 'PRO'
          await prisma.user.update({
            where: { id: userId },
            data:  { plan: plan as any, stripeSubscriptionId: sub.id },
          })
          console.log(`[webhook] Updated subscription to ${plan} for user ${userId}`)
        } else if (status === 'past_due') {
          console.warn(`[webhook] Subscription past_due for user ${userId}`)
          // Don't downgrade yet — give grace period
        }
        break
      }

      // ── Subscription cancelled / expired → downgrade to FREE ────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object
        const userId = sub.metadata?.userId

        if (!userId) {
          // Fallback: find by stripeSubscriptionId
          const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: sub.id } })
          if (user) {
            await prisma.user.update({ where: { id: user.id }, data: { plan: 'FREE', stripeSubscriptionId: null } })
            console.log(`[webhook] Downgraded user ${user.id} to FREE (by subId lookup)`)
          }
          break
        }
        await prisma.user.update({
          where: { id: userId },
          data:  { plan: 'FREE', stripeSubscriptionId: null },
        })
        console.log(`[webhook] Downgraded user ${userId} to FREE`)
        break
      }

      // ── Invoice paid → extend subscription (safety net) ─────────────
      case 'invoice.payment_succeeded': {
        const invoice  = event.data.object
        const subId    = invoice.subscription as string
        if (!subId) break
        const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subId } })
        if (user && user.plan === 'FREE') {
          // Shouldn't happen, but recover gracefully
          await prisma.user.update({ where: { id: user.id }, data: { plan: 'PRO' } })
          console.log(`[webhook] Recovered user ${user.id} to PRO on invoice.payment_succeeded`)
        }
        break
      }

      // ── Payment failed → warn (but don't downgrade immediately) ─────
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.warn(`[webhook] Payment failed for invoice ${invoice.id}`)
        // Stripe handles retries automatically; we'll downgrade on subscription.deleted
        break
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err: any) {
    console.error(`[webhook] Handler error for ${event.type}:`, err?.message)
    // Return 200 so Stripe doesn't retry — we log and investigate
  }

  return NextResponse.json({ received: true })
}
