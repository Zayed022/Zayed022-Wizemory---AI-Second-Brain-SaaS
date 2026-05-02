/**
 * lib/stripe.ts
 * Safe Stripe singleton — does NOT crash at module load when key is missing.
 * This is critical for Vercel builds where env vars may not be set.
 */

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key === 'sk_test_placeholder' || key.length < 10) return null
  // Lazy import so the module doesn't fail during build
  const Stripe = require('stripe')
  return new Stripe(key, { apiVersion: '2024-04-10', typescript: true })
}

export async function createCheckoutSession(
  userId: string, email: string, priceId: string,
  successUrl: string, cancelUrl: string
) {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.checkout.sessions.create({
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
    allow_promotion_codes: true,
  })
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl })
}
