# WizeMory — AI-Powered Second Brain SaaS

> Save anything. Remember everything. Your knowledge, supercharged by AI.

**Live at:** https://wizemory.com  
**Demo:** https://wizemory.com/demo  
**Founder dashboard:** https://wizemory.com/founder

---

## What WizeMory Does

WizeMory is an AI-powered knowledge management SaaS. Users save articles, YouTube videos, notes, PDFs, and voice memos. Gemini AI reads everything, writes summaries, extracts key insights, discovers connections, and resurfaces content through spaced repetition — automatically, with zero manual organisation.

**The core insight:** Every other knowledge tool makes you do the work. WizeMory does it for you.

---

## Business Metrics

| Metric | Value |
|---|---|
| Pricing | Free · $12/mo Pro · $49/user/mo Team · $199/mo Business |
| Gross margin | ~95% (AI is free via Gemini) |
| Monthly infra cost | $0 at launch (all free tiers) |
| Viral loop | Share cards + referral programme built in |
| Retention hooks | Spaced repetition · Streaks · Weekly digest email |
| Acquisition valuation | $100K–$200K+ (see /founder) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14, TypeScript, Tailwind CSS |
| Auth | Clerk (free tier, 10K MAU) |
| Database | Supabase PostgreSQL (Prisma ORM) |
| AI | Google Gemini 2.5 Flash (free) + Groq Llama 3.3 70B (fallback) |
| Payments | Stripe (subscriptions, webhooks) |
| Email | Resend |
| Rate limiting | Upstash Redis |
| Storage | AWS S3 (optional, for PDFs) |
| Deployment | Vercel (3 automated cron jobs) |

---

## Features

### Core (all plans)
- AI summarisation in 20 seconds — articles, notes, PDFs, YouTube, voice
- AI Q&A from your own knowledge base
- Full-text search
- Collections, highlights, tags
- Browser extension (Chrome/Brave/Edge)
- Data export (JSON/Markdown)
- Referral programme (3 referrals = 1 free Pro month)

### Pro ($12/month)
- Unlimited items and AI queries
- Spaced repetition review queue (SM-2 algorithm)
- YouTube & video summarisation
- AI connection discovery
- Knowledge graph visualisation (D3 force-directed)
- AI writing assistant (threads, blog posts, newsletters)
- AI memory coach (daily personalised recommendations)
- Lifetime stats dashboard
- Weekly digest email
- Streaks + achievement badges

### Team ($49/user/month)
- Everything in Pro
- Shared knowledge bases
- Team memory assistant
- Onboarding doc summariser
- Internal company doc search
- Admin dashboard
- API access

### Business ($199/month)
- Everything in Team + unlimited members
- Dedicated success manager
- Custom integrations
- SLA guarantee
- White-label option

---

## Deployment

```bash
# 1. Clone and install
npm install

# 2. Copy env and fill in keys
cp .env.example .env.local

# 3. Push database schema
npx prisma db push

# 4. Run locally
npm run dev

# 5. Deploy to Vercel
git push  # auto-deploys on push
```

### Vercel Cron Jobs (auto-configured)
- Monday 8am UTC — weekly digest emails to all Pro/Team users
- Daily 9am UTC — review reminder emails (items due for spaced repetition)
- Daily 8pm UTC — streak rescue emails (users at risk of breaking streak)

---

## Key Pages

| Page | URL |
|---|---|
| Landing | / |
| Demo | /demo |
| Pricing | /pricing |
| vs Notion/Readwise/Obsidian | /vs |
| Team/B2B | /team |
| Founder dashboard | /founder |
| Blog | /blog |
| SEO tools | /tools/summarize-youtube-video, /tools/second-brain-app, etc. |

---

## Architecture

```
User saves URL/Note/YouTube
        ↓
POST /api/items (creates item, status=PROCESSING)
        ↓
Triggers /api/items/process via HTTP (survives Vercel timeout)
        ↓
Gemini AI: fetches full content → summary + insights + tags
        ↓
Item updated (status=READY)
        ↓
Background: /api/ai/connections finds links to other items
        ↓
Cron (Mon 8am): /api/digest/cron generates weekly digest email
```

---

## Why This Is Acquisition-Ready

1. **Deep retention moat** — users accumulate years of knowledge. Switching cost approaches infinity.
2. **Zero CAC** — every share card, referral, and digest email drives organic signups.
3. **$0 infra** — runs on Gemini free tier. 95%+ gross margin from day one.
4. **B2B expansion** — Team plan at $49/user is a massive revenue multiplier.
5. **Data asset** — structured knowledge base is valuable training data.
6. **Complete product** — working AI pipeline, browser extension, PWA, 3 crons, 6 email sequences. No rebuild needed.

See `/founder` for the live valuation estimator.

---

## Valuation Basis

- 3–8× ARR on revenue (standard SaaS multiple)
- Asset-based floor: $15/registered user + $500/paid user + code value
- Comparable acquisitions: Readwise ($12M ARR, bootstrapped), Roam Research ($17M ARR)
- At 1,000 Pro users ($12K MRR = $144K ARR): **$432K–$1.15M valuation range**
- At 500 Pro users ($6K MRR): **$100K–$200K realistic ask**

---

## License

Proprietary. All rights reserved.
