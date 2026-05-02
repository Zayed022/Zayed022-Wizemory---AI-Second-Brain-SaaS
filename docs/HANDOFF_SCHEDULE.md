# WizeMory — 30-Day Buyer Handoff Schedule

> **For the buyer.** This document is your complete day-by-day onboarding plan.
> By Day 30, you will own, understand, and be actively growing WizeMory.
>
> Seller support: founders@wizemory.com · 24-hour response SLA

---

## Overview

| Week | Theme | Goal |
|---|---|---|
| Week 1 (Days 1–7) | Setup & access | Everything running under your accounts |
| Week 2 (Days 8–14) | Walkthrough | Full codebase understanding |
| Week 3 (Days 15–21) | First feature | Ship one improvement yourself |
| Week 4 (Days 22–30) | Handover | Fully independent, seller steps back |

---

## WEEK 1 — Setup & Access (Days 1–7)

**Goal:** WizeMory is running under your accounts, domain, and payment processor.

---

### Day 1 — Repository handoff

**Morning (2 hours)**
- [ ] Seller transfers GitHub repository to buyer's GitHub account
- [ ] Buyer clones repo locally: `git clone [your-new-repo-url]`
- [ ] Buyer installs dependencies: `npm install`
- [ ] Buyer runs locally: `npm run dev` — confirm it loads at `localhost:3000`

**Afternoon (1 hour)**
- [ ] Buyer reads `README.md` end to end (30 min)
- [ ] Buyer reads `docs/TECHNICAL_DUE_DILIGENCE.md` sections 1–4
- [ ] Open question: send any blockers to seller by EOD

**Seller action:** Transfer repository ownership, send `.env.local` file with all working keys.

---

### Day 2 — Database setup

**Goal:** Buyer controls the Supabase database.

- [ ] Create a new Supabase project at [supabase.com](https://supabase.com)
  - Project name: `memora-production`
  - Region: choose closest to your target users
  - Password: generate a strong password, save it
- [ ] Copy `DATABASE_URL` and `DIRECT_URL` from Supabase → Settings → Database
  - **Important:** URL-encode any `@` in your password as `%40`
- [ ] Run schema migration: `npx prisma db push`
- [ ] Confirm tables created: open Supabase Table Editor, verify 12+ tables exist
- [ ] Update `.env.local` with new database URLs
- [ ] Restart `npm run dev` and verify dashboard loads

**Time estimate:** 1.5 hours

---

### Day 3 — Authentication setup

**Goal:** Buyer controls Clerk auth, new users will sign up under buyer's account.

- [ ] Create Clerk account at [clerk.com](https://clerk.com)
- [ ] Create new application: "WizeMory"
- [ ] Enable sign-in methods: Email + Google OAuth (at minimum)
- [ ] Copy API keys to `.env.local`:
  ```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
  CLERK_SECRET_KEY=sk_live_...
  ```
- [ ] Set redirect URLs in Clerk dashboard:
  - After sign-in: `/dashboard`
  - After sign-up: `/dashboard`
- [ ] Add a Clerk webhook pointing to `/api/auth/webhook` (select `user.created`, `user.deleted`)
- [ ] Test: sign up with a new account, confirm you see the dashboard

**Time estimate:** 1 hour

---

### Day 4 — AI keys setup

**Goal:** Gemini and Groq API keys active under buyer's accounts.

**Gemini (primary, free):**
- [ ] Go to [aistudio.google.com](https://aistudio.google.com)
- [ ] Click "Get API key" → Create API key
- [ ] Add to `.env.local`: `GEMINI_API_KEY=AIza...`

**Groq (fallback, free):**
- [ ] Go to [console.groq.com](https://console.groq.com)
- [ ] API Keys → Create new key
- [ ] Add to `.env.local`: `GROQ_API_KEY=gsk_...`

**Test:**
- [ ] Go to `/dashboard/add`, paste a URL, save it
- [ ] Wait 20 seconds — confirm item appears as READY with a summary
- [ ] Go to `/dashboard` → AI chat, ask a question, confirm you get an answer

**Time estimate:** 45 minutes

---

### Day 5 — Stripe payments setup

**Goal:** Real payment processing active. Users can subscribe from Day 5.

Follow the complete guide in `docs/STRIPE_SETUP_GUIDE.md`.

**Checklist summary:**
- [ ] Create Stripe account (or use existing)
- [ ] Create 5 products and price IDs (Pro monthly, Pro yearly, Team monthly, Team yearly, Business)
- [ ] Add all `STRIPE_*` env vars to `.env.local`
- [ ] Add Stripe webhook pointing to `/api/billing/webhook`
- [ ] Test checkout: go to `/pricing`, click "Get Pro", complete test payment
- [ ] Verify: check Supabase — user's plan column should update to `PRO`

**Time estimate:** 2 hours (see full Stripe guide)

---

### Day 6 — Domain & Vercel deployment

**Goal:** WizeMory is live on your domain.

- [ ] Create Vercel account at [vercel.com](https://vercel.com) (if needed)
- [ ] Connect GitHub repository to Vercel
- [ ] Add all environment variables in Vercel → Settings → Environment Variables
  - Copy every line from your `.env.local`
  - Set `NEXT_PUBLIC_APP_URL` to your new domain (e.g. `https://yourdomain.com`)
- [ ] Deploy: `git push` — Vercel auto-deploys
- [ ] Verify deployment: open your Vercel URL, confirm app loads
- [ ] Add custom domain in Vercel → Settings → Domains
- [ ] Update DNS records at your registrar (Vercel provides exact records)
- [ ] Wait for DNS propagation (5 min – 48 hours)

**Time estimate:** 2 hours

---

### Day 7 — Smoke test & review

**Goal:** Everything works end-to-end under your accounts.

Run this checklist with your own accounts (not seller's):

- [ ] Sign up as a new user
- [ ] Save an article URL — confirm READY within 30 seconds
- [ ] Save a YouTube URL — confirm READY within 30 seconds
- [ ] Ask an AI question — confirm answer returned (Pro feature)
- [ ] Click upgrade on Free account — confirm Stripe checkout opens
- [ ] Complete a test payment ($12 Pro) — confirm plan updates to PRO
- [ ] View knowledge graph at `/dashboard/graph`
- [ ] Export data at `/dashboard/settings`
- [ ] View founder dashboard at `/founder` with your admin secret
- [ ] Send seller a summary of any issues found

**End of Week 1:** You own the codebase, database, auth, AI, payments, and deployment. WizeMory is fully operational under your accounts.

---

## WEEK 2 — Code Walkthrough (Days 8–14)

**Goal:** Full understanding of the codebase. Know exactly where everything lives.

---

### Day 8 — Core architecture tour

Live 90-minute call with seller:
1. Walk through directory structure (`/app`, `/lib`, `/components`, `/prisma`)
2. Trace a request: user saves URL → `POST /api/items` → `lib/processItem.ts` → Gemini → DB
3. Walk through `lib/gate.ts` — how plan gating works
4. Walk through `prisma/schema.prisma` — the 12 data models
5. Q&A

**Self-study after call (1 hour):**
- [ ] Read `lib/processItem.ts` end to end — understand the timeout and fallback
- [ ] Read `lib/ai.ts` end to end — understand the Gemini→Groq waterfall

---

### Day 9 — AI pipeline deep dive

- [ ] Read `lib/agent/engine.ts` — the ReAct loop, function calling, fallback
- [ ] Read `lib/agent/tools.ts` — all 8 tools, understand the extensibility pattern
- [ ] Exercise: add a test tool to `MEMORA_TOOLS` that just returns "Hello world" — verify it runs in the agent

**Time estimate:** 2 hours

---

### Day 10 — Frontend architecture

- [ ] Read `app/dashboard/layout.tsx` — how sidebar and Pro badges work
- [ ] Read `components/dashboard/DashboardClient.tsx` — polling, retry, state
- [ ] Read `components/dashboard/KnowledgeGraphClient.tsx` — D3, simulation, interactions
- [ ] Exercise: change one nav item label and redeploy — verify it works

**Time estimate:** 2 hours

---

### Day 11 — Payments & webhooks

- [ ] Read `app/api/billing/checkout/route.ts` — checkout session creation
- [ ] Read `app/api/billing/webhook/route.ts` — all 5 event handlers
- [ ] Simulate a cancelled subscription in Stripe test mode — verify plan downgrades to FREE in DB
- [ ] Simulate a failed payment — verify plan is NOT immediately downgraded

**Time estimate:** 1.5 hours

---

### Day 12 — Email sequences review

- [ ] Read `lib/email.ts` — all 6 email sequences
- [ ] Set up Resend account at [resend.com](https://resend.com)
- [ ] Add `RESEND_API_KEY` to Vercel env vars
- [ ] Trigger a test digest email: call `GET /api/digest/cron?task=digest` with the cron secret
- [ ] Verify email received with correct formatting

**Time estimate:** 1.5 hours

---

### Day 13 — SEO & analytics

- [ ] Review all 5 SEO tool pages in `/app/tools/`
- [ ] Set up Google Analytics 4 account
- [ ] Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to Vercel
- [ ] Verify GA4 is tracking page views (check Realtime in GA4)
- [ ] Submit sitemap to Google Search Console: `yourdomain.com/sitemap.xml`

**Time estimate:** 1.5 hours

---

### Day 14 — End of Week 2 review

- [ ] Write a 1-page summary of the codebase in your own words
- [ ] Identify 3 features you want to add or improve
- [ ] Send summary to seller for feedback
- [ ] 30-minute async Q&A with seller (email or Loom)

---

## WEEK 3 — First Feature (Days 15–21)

**Goal:** Ship one real improvement to the product, end to end.

---

### Day 15 — Choose and scope your first feature

From the extensibility guide in `docs/TECHNICAL_DUE_DILIGENCE.md`, estimated times:
- New agent tool: **30 minutes**
- New email sequence: **20 minutes**
- New dashboard page: **2–4 hours**
- Enable semantic search (pgvector): **4–6 hours** ← recommended
- Slack integration for Team plan: **1–2 days**

**Recommended first feature:** Enable semantic search via pgvector.
This is a major product upgrade and demonstrates full-stack ownership.

Steps for pgvector:
- [ ] Enable pgvector extension in Supabase: `create extension if not exists vector;`
- [ ] Run embedding generation script (provided separately)
- [ ] Update search API to use vector similarity
- [ ] Deploy and test

---

### Days 16–19 — Build and ship

Self-directed. Seller available for async questions within 24 hours.

---

### Day 20 — Code review with seller

- [ ] Submit a GitHub pull request with your changes
- [ ] 45-minute live review call with seller
- [ ] Address any feedback, merge to main, deploy

---

### Day 21 — End of Week 3

- [ ] First feature shipped to production
- [ ] Announce it (tweet, Product Hunt comment, newsletter)
- [ ] Review Week 4 handover checklist with seller

---

## WEEK 4 — Full Handover (Days 22–30)

**Goal:** Seller steps back completely. You are fully independent.

---

### Days 22–24 — Solo operation

- [ ] Handle all operations independently for 3 days
- [ ] Note any questions that come up — save them for the Day 25 call
- [ ] Monitor error logs in Vercel
- [ ] Check Stripe dashboard for any payment issues

---

### Day 25 — Final Q&A call (45 minutes)

- [ ] Go through saved questions with seller
- [ ] Walk through the ops checklist together one final time
- [ ] Confirm all access transfers are complete

---

### Days 26–28 — Marketing setup

- [ ] List WizeMory on relevant directories (Product Hunt, AlternativeTo, Saasworthy)
- [ ] Write first "building in public" tweet thread
- [ ] Set up ConvertKit/Beehiiv for newsletter (optional but recommended)
- [ ] Respond to any early organic signups personally

---

### Day 29 — Transfer final assets

Seller transfers:
- [ ] Any custom domain email (founders@wizemory.com → your email)
- [ ] Social accounts (Twitter/X, LinkedIn) if included in deal
- [ ] Google Workspace or email aliases

---

### Day 30 — Handoff complete

Final checklist:
- [ ] All accounts fully transferred (GitHub, Vercel, Clerk, Supabase, Stripe, Resend)
- [ ] Seller removed from all accounts
- [ ] Buyer has sole admin access everywhere
- [ ] First feature shipped
- [ ] At least 1 new organic signup since acquisition

**🎉 WizeMory is now fully yours.**

---

## Post-handoff support

Seller remains available for:
- **30 days post-handoff:** Email Q&A, 24-hour response
- **60 days post-handoff:** Critical bug support (by prior agreement)
- **Optional retainer:** $500–$1,000/month for ongoing advisory

Contact: founders@wizemory.com

---

## Ops checklist (keep this, run weekly)

```
Every week:
  □ Check Vercel deploy logs for errors
  □ Check Stripe for failed payments or disputes
  □ Monitor Supabase database size (free tier: 500MB)
  □ Check Gemini API quota in Google Cloud console
  □ Respond to any support emails

Every month:
  □ Review GA4 analytics — signups, activation, retention
  □ Check open GitHub issues
  □ Review /founder dashboard — update demo data if needed
  □ Evaluate 1-2 new features to ship
```

---

*This handoff plan is designed to make you fully independent and confident within 30 days.
Every step has been tested. Estimated total time: 40–60 hours over 30 days.*
