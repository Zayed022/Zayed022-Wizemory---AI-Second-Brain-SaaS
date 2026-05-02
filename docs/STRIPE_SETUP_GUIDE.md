# Stripe Dashboard Setup Guide

> **For the buyer.** Follow this guide exactly and WizeMory will be collecting real payments
> within 2 hours. Every step maps precisely to the code.

---

## Before you start

You need:
- A Stripe account ([stripe.com](https://stripe.com)) — free to create
- Access to your WizeMory codebase and Vercel environment variables
- 2 hours of uninterrupted time

You do **not** need:
- A developer to help you
- Any coding knowledge
- A business entity (you can start as an individual)

---

## Step 1 — Create your Stripe account

1. Go to [stripe.com](https://stripe.com) → Create account
2. Enter your email, name, country, and password
3. Verify your email
4. Complete identity verification (required to receive payouts)
   - Business type: Individual or Company
   - Upload ID when prompted

**Test mode vs Live mode:**
- Stripe starts in **Test mode** (no real money)
- Use Test mode to verify everything works
- Switch to **Live mode** when ready to charge real customers

---

## Step 2 — Get your API keys

In the Stripe Dashboard:

1. Click **Developers** (top right) → **API keys**
2. Copy these two values:

| Key | Where to use | Example |
|---|---|---|
| Publishable key | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| Secret key | `STRIPE_SECRET_KEY` | `sk_live_...` |

> **Test mode:** Keys start with `pk_test_` and `sk_test_`
> **Live mode:** Keys start with `pk_live_` and `sk_live_`

Add both to your Vercel environment variables.

---

## Step 3 — Create Products and Prices

This is the most important step. The code expects **exactly 5 price IDs**.

Go to **Products** in the Stripe Dashboard → **+ Add product**

Create these 5 products in this exact order:

---

### Product 1: WizeMory Pro (Monthly)

- **Name:** `WizeMory Pro`
- **Description:** `Unlimited items, AI Q&A, knowledge graph, weekly digest, data export`
- **Pricing model:** Standard pricing
- **Price:** `$12.00`
- **Billing period:** Monthly
- **Currency:** USD

After saving, copy the **Price ID** (starts with `price_`)
→ This is your `STRIPE_PRO_PRICE_ID`

---

### Product 2: WizeMory Pro (Yearly)

On the same **WizeMory Pro** product page, click **+ Add another price**

- **Price:** `$99.00`
- **Billing period:** Yearly
- **Currency:** USD

Copy this Price ID
→ This is your `STRIPE_PRO_YEARLY_PRICE_ID`

---

### Product 3: WizeMory Team (Monthly)

- **Name:** `WizeMory Team`
- **Description:** `Shared knowledge base, team memory assistant, admin dashboard, API access`
- **Pricing model:** Standard pricing
- **Price:** `$49.00`
- **Billing period:** Monthly
- **Per unit:** Yes (per seat)

Copy the Price ID
→ This is your `STRIPE_TEAM_PRICE_ID`

---

### Product 4: WizeMory Team (Yearly)

On the same **WizeMory Team** product, add another price:

- **Price:** `$399.00`
- **Billing period:** Yearly

Copy this Price ID
→ This is your `STRIPE_TEAM_YEARLY_PRICE_ID`

---

### Product 5: WizeMory Business

- **Name:** `WizeMory Business`
- **Description:** `Unlimited team members, dedicated support, custom integrations, SLA`
- **Price:** `$199.00`
- **Billing period:** Monthly

Copy the Price ID
→ This is your `STRIPE_BUSINESS_PRICE_ID`

---

## Step 4 — Add all price IDs to Vercel

In Vercel → Your project → Settings → Environment Variables, add:

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...
STRIPE_TEAM_YEARLY_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
```

**Important:** Set these for **Production** environment only.
Keep Test mode keys in **Preview** environment for safe testing.

---

## Step 5 — Create the Webhook

This is what updates a user's plan in the database when they pay.

In Stripe Dashboard:
1. Click **Developers** → **Webhooks** → **+ Add endpoint**

2. **Endpoint URL:**
   ```
   https://yourdomain.com/api/billing/webhook
   ```
   Replace `yourdomain.com` with your actual domain.

3. **Events to listen to** — select exactly these 5:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. Click **Add endpoint**

5. On the webhook detail page, click **Reveal signing secret**
   Copy the value (starts with `whsec_`)

6. Add to Vercel:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

7. Redeploy Vercel after adding this variable.

---

## Step 6 — Set up the Billing Portal

This lets paying customers manage their subscription (upgrade, downgrade, cancel) without contacting you.

In Stripe Dashboard:
1. Go to **Settings** → **Billing** → **Customer portal**
2. Enable the portal
3. Configure what customers can do:
   - ✅ Cancel subscriptions
   - ✅ Update payment methods
   - ✅ View invoice history
   - ✅ Switch plans (optional)
4. Set the **Return URL** to: `https://yourdomain.com/dashboard/settings`
5. Click **Save**

Customers access the portal from Settings → "Manage billing".

---

## Step 7 — Test the complete flow

Use Stripe's test card numbers (Test mode only):

| Scenario | Card number | Result |
|---|---|---|
| Successful payment | `4242 4242 4242 4242` | Payment succeeds |
| Card declined | `4000 0000 0000 0002` | Payment fails |
| 3D Secure required | `4000 0025 0000 3155` | Auth popup appears |

For all test cards: any future expiry date, any 3-digit CVC, any zip.

**Test checklist:**
- [ ] Go to `/pricing` on your live domain
- [ ] Click "Get Pro" → confirm Stripe checkout opens
- [ ] Complete payment with test card `4242 4242 4242 4242`
- [ ] Confirm redirect to `/dashboard/settings?upgraded=1`
- [ ] Check Supabase: user's `plan` column should show `PRO`
- [ ] Check Stripe Dashboard: payment appears in Payments tab
- [ ] Click "Manage billing" in Settings → confirm portal opens
- [ ] Cancel the test subscription → confirm user downgrades to `FREE` in DB (may take 30 seconds)

---

## Step 8 — Switch to Live mode

When you're ready to charge real customers:

1. In Stripe Dashboard, toggle from **Test** to **Live** (top left)
2. Get your **Live** API keys (Developers → API keys)
3. Create the same 5 products/prices in Live mode
4. Create a new webhook in Live mode pointing to the same URL
5. Update Vercel environment variables with Live mode keys and price IDs
6. Redeploy

> **Never mix Test and Live keys.** Always use Live keys in production.

---

## Troubleshooting

**"No such price" error in checkout:**
→ You're using a Test price ID with a Live secret key, or vice versa. Check that all keys are from the same mode.

**Webhook not receiving events:**
→ Check the webhook URL is correct (no trailing slash). Check Stripe Dashboard → Webhooks → your endpoint → Recent deliveries for error details.

**User plan not updating after payment:**
→ Check the webhook is receiving `checkout.session.completed`. Check Vercel logs for `[webhook]` entries. The `userId` must be in the session metadata — this is set automatically by our checkout code.

**"No billing account" error in portal:**
→ The user has never had a Stripe subscription. They need to subscribe first through the checkout flow, then the portal becomes available.

**Payment succeeds but plan stays FREE:**
→ Check `STRIPE_WEBHOOK_SECRET` is set correctly in Vercel. Webhook signature verification fails silently if this is wrong.

---

## What the code does automatically

For reference — you don't need to change any of this:

| Event | What happens |
|---|---|
| `checkout.session.completed` | User's `plan` updated to PRO/TEAM/BUSINESS in DB |
| `customer.subscription.updated` | Plan updated if status is `active` or `trialing` |
| `customer.subscription.deleted` | User downgraded to `FREE` |
| `invoice.payment_succeeded` | Recovery if user was incorrectly on FREE |
| `invoice.payment_failed` | Logged — no immediate downgrade (Stripe retries) |

---

## Summary: all env vars required for payments

```bash
# Stripe keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe price IDs (create in Stripe Dashboard → Products)
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...
STRIPE_TEAM_YEARLY_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
```

---

*Questions? Email founders@wizemory.com — we'll help you get payments working.*
