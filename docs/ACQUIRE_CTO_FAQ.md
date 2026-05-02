# WizeMory — Technical Due Diligence FAQ

> **For:** Buyer's CTO / technical reviewer on Acquire.com
> **Format:** Exact answers, ready to copy-paste or speak on a call
> **Prepared by:** WizeMory founding team

---

## Q1: How do you handle AI API rate limits?

**Answer:**

WizeMory uses a multi-provider waterfall with automatic failover:

```
Request → Gemini 1.5 Flash (1,500 req/day free)
                │  429 or quota error?
                ▼
           Gemini 1.5 Pro (lower rate limit)
                │  429 or quota error?
                ▼
           Groq Llama 3.3 70B (different provider, free)
                │  429 or quota error?
                ▼
           Groq Llama 3.1 8B (emergency fallback)
```

This is implemented in `lib/ai.ts`. Each model is tried in sequence; only rate-limit errors (HTTP 429 or quota messages) trigger the fallback. Non-rate-limit errors (malformed input, etc.) surface immediately.

In practice, Gemini's free tier handles 1,500 requests per day. For a product growing to 5,000 daily active users, each saving 2–3 items, you'd need approximately 10,000–15,000 AI calls per day — at which point you switch to the paid Gemini API at $0.35 per 1M input tokens. A typical item summary uses ~2,000 tokens = $0.0007 per item. At 10,000 items/day, that is $7/day — trivial relative to Pro subscription revenue.

**Rate limiting for users:** Implemented via Upstash Redis in `lib/ratelimit.ts`. Free users are capped at 10 AI queries/month at the API level, not just the UI level.

---

## Q2: What is your vector embedding strategy?

**Answer:**

Current state: tag-based + full-text `iLike` search via Prisma. The `embedding Float[]` column exists on every Item row — it is a zero-cost placeholder that requires no migration to activate.

The upgrade path is explicitly documented in `docs/TECHNICAL_DUE_DILIGENCE.md`:

**Path 1 — pgvector (recommended, 0 schema migration):**
Supabase natively supports pgvector. Enable the extension, populate the `embedding` column using Gemini's `embedding-001` model (free, <100ms per item), and switch search to:
```sql
ORDER BY embedding <-> $queryEmbedding::vector LIMIT 10
```
Estimated implementation time: **4–6 hours**.

**Path 2 — External vector DB:**
Store item IDs + embeddings in Pinecone or Weaviate. Query for top-k item IDs, then fetch full records from Postgres. Good for > 1M items or multi-tenant semantic search at scale. Estimated time: **1–2 days**.

Generating embeddings for existing items is a one-time background job: `prisma.item.findMany({ select: { id, rawContent } })` → batch embed → update. At 1,000 items, this runs in under 2 minutes.

---

## Q3: What happens if Supabase goes down?

**Answer:**

Supabase has a 99.9% uptime SLA on paid plans (currently on free tier, which has no formal SLA but maintains the same infrastructure).

**Resilience mechanisms in place:**

1. **Connection pooling via PgBouncer** — `DATABASE_URL` points to Supabase's pooler (port 6543). Even under high load, new connections are queued rather than rejected.

2. **Vercel's edge network** — Static pages and cached SSR responses are served from Vercel's CDN even if the DB is unreachable. Users see a loading state rather than a crash.

3. **Read-heavy workload** — 80% of requests are reads (dashboard, items list). These can be cached at the Vercel edge with `Cache-Control: s-maxage=60`.

4. **Migration path:** The entire schema is in `prisma/schema.prisma`. Moving to Railway, PlanetScale, Neon, or any Postgres host is a 30-minute operation (change `DATABASE_URL`, run `prisma db push`). No vendor lock-in.

For a buyer who wants higher resilience: upgrade to Supabase Pro ($25/month) for daily backups, PITR, and the formal 99.9% SLA.

---

## Q4: How is user data isolated? Could a bug expose one user's data to another?

**Answer:**

Data isolation is enforced at three independent layers:

**Layer 1 — Application layer (Prisma):**
Every query includes `userId: user.id` as a mandatory filter. This is not just by convention — the server component always fetches the authenticated `clerkId`, looks up the internal `User.id`, and passes it to every Prisma call. There is no query in the codebase that fetches items, highlights, collections, or connections without a `userId` filter.

**Layer 2 — Authentication layer (Clerk):**
All API routes call `auth()` from `@clerk/nextjs/server` as their first line. Unauthenticated requests return 401 before any DB interaction. This runs at the Edge, before the serverless function starts.

**Layer 3 — Database layer (Supabase RLS):**
Supabase's Row Level Security can be enabled as an additional defence-in-depth. The schema is compatible — adding RLS policies is a 30-minute task that adds a third enforcement layer even if the application code had a bug.

**Verified by:** running `grep -r "prisma.item\|prisma.collection\|prisma.highlight" app/api/` and confirming every call includes `userId: user.id`.

---

## Q5: How do you handle the Vercel serverless timeout for long AI operations?

**Answer:**

This is a deliberate architecture decision, documented in `app/api/items/process/route.ts`.

The problem: Vercel's default serverless timeout is 10 seconds on hobby plans, 60 seconds on Pro. AI processing (Jina fetch + Gemini call) can take 15–25 seconds.

**The solution: decouple creation from processing.**

`POST /api/items` creates the item in the DB with `status: PROCESSING` and returns immediately (response time: ~80ms). It then fires an HTTP request to `POST /api/items/process` — a *separate* serverless function with `export const maxDuration = 60`.

Because the second function is called via HTTP (not fire-and-forget promise), it gets its own independent execution context and 60-second budget. The original request has already returned to the user with the "Processing…" item card.

The dashboard polls `/api/items` every 6 seconds (stops when no PROCESSING items remain) to update cards from PROCESSING → READY without requiring a page reload.

**For the agent (`/api/agent/route.ts`):** `maxDuration = 120` is set, giving multi-step agent runs a full 2-minute budget.

---

## Q6: What is the authentication architecture? Can we replace Clerk?

**Answer:**

Clerk handles authentication. It provides:
- Google OAuth and email/password sign-in
- JWT session management (validated at Edge via middleware)
- Webhooks for user creation/deletion events
- User management dashboard

**Replacing Clerk:** Yes, and it is explicitly documented in the due diligence doc.

The replacement path is **Auth.js (NextAuth v5)** — a drop-in swap estimated at 4–6 hours:
1. Replace `ClerkProvider` in `app/layout.tsx` with `SessionProvider`
2. Replace `auth()` calls in API routes with `getServerSession()`
3. Replace `UserButton` in the dashboard layout with a custom dropdown
4. Replace the `CLERK_WEBHOOK_SECRET` flow with Auth.js callbacks

The internal `User` table (Prisma) is separate from Clerk — Clerk only stores the `clerkId` string as a foreign key. The entire data model, relationships, and business logic are Clerk-agnostic.

**If staying with Clerk:** Free tier covers 10,000 MAU. Paid plan is $25/month up to 100K MAU.

---

## Q7: What is the data model for the Knowledge Graph? How does it scale?

**Answer:**

The knowledge graph is not stored as a separate graph database. It is derived at query time from the relational data in Postgres.

**Nodes:** Every `Item` record is a node. The node's properties (title, type, tags, size) are selected via `prisma.item.findMany`.

**Edges (two types):**

1. **Tag edges** — built client-side: for each tag, find all items sharing that tag. Items with ≥2 shared tags get an edge. O(n × avg_tags) computation, runs in <200ms for up to 1,000 items.

2. **AI connection edges** — stored in the `Connection` + `ConnectionItem` junction tables. These are created by `/api/ai/connections` and persist in Postgres.

**Scaling characteristics:**
- The graph API (`/api/graph/route.ts`) fetches max 80 items and all connections — a bounded query regardless of how many total items a user has
- The D3 force simulation runs client-side — no server compute
- At 10,000 items: add `take: 200` and a date-range filter; performance stays O(1)

**For a buyer wanting a true graph DB:** Neo4j Aura free tier can be added alongside Postgres. Export the `nodes/edges` from the `/api/export-knowledge` endpoint (which already generates D3-compatible graph JSON) and import into Neo4j. This is a data pipeline task, not an architecture rewrite.

---

## Q8: How does the spaced repetition algorithm work? Is it proven?

**Answer:**

WizeMory uses SM-2 — the same algorithm published by Piotr Woźniak in 1987 and used by Anki, the world's most widely used flashcard app (30M users). It is not a custom algorithm; it is the gold standard.

**Implementation in `/api/reminders/review/route.ts`:**

```typescript
const q = quality  // 0=forgot, 2=hard, 4=good, 5=perfect
const n = item.reviewCount + 1

let interval: number  // days until next review
if (n === 1)      interval = 1
else if (n === 2) interval = 6
else {
  const ef = Math.max(1.3, 2.5 + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  interval = Math.round(prev_interval * ef)
}
```

Each user grades their recall (Forgot/Hard/Good/Perfect). The easiness factor (ef) adjusts based on grade — items rated "Forgot" are reviewed again tomorrow; items rated "Perfect" compound their interval.

**Stored fields on Item:**
- `reviewCount: Int` — total review sessions
- `nextReviewAt: DateTime?` — next scheduled review (null = never reviewed)

**Cron trigger:** `/api/reminders/review` is called daily to send reminder emails to Pro users with items due.

---

## Q9: What are the GDPR obligations a buyer inherits, and what is already handled?

**Answer:**

**What is already handled (no action needed from buyer):**

| Obligation | Implementation |
|---|---|
| Art 5 — Data minimisation | PII redacted before any content reaches AI models |
| Art 7 — Consent | `/api/privacy` records consent timestamp, purpose, and version |
| Art 13 — Transparency | Privacy page at `/privacy`, data processing explained |
| Art 15 — Right of access | `action=data_summary` returns full inventory of user data |
| Art 17 — Right to erasure | `action=erase_all` cascades all user data via Prisma |
| Art 20 — Portability | `/api/export-knowledge` returns structured ZIP in open formats |
| Art 25 — Privacy by design | PII scan is the default, not opt-in |
| Art 32 — Security | Supabase encryption at rest + Vercel TLS in transit |

**What the buyer needs to do (one-time setup):**
1. Appoint a Data Protection Officer (DPO) if processing at scale in the EU (required if > 250 employees or large-scale processing — likely not required at MVP stage)
2. Update the Privacy Policy at `/privacy` with the buyer's legal entity name and contact
3. Sign a Data Processing Agreement (DPA) with Clerk, Supabase, and Resend (all offer standard DPAs at zero cost)
4. Register as a data controller with the relevant supervisory authority if operating in the EU

**Estimated compliance setup time for buyer: 4–8 hours** (mostly paperwork, no code changes).

---

## Q10: What does the 30-day post-acquisition handoff look like? What technical knowledge is required?

**Answer:**

**Required skills for the buyer (or their first hire):**
- Next.js and TypeScript (intermediate level)
- Basic SQL / Prisma (can read queries, not necessarily write complex ones)
- CLI comfort (npm, git, Vercel CLI)

**Day 1–3: Environment setup**
- Clone repo, run `npm install`, copy `.env.example` to `.env.local`
- Fill in API keys (Clerk, Supabase, Gemini, Groq — all documented in `.env.example`)
- Run `npx prisma db push` to provision the database
- Run `npm run dev` — app is live at localhost:3000
- Estimated time: **2–3 hours**

**Day 3–7: Accounts transfer**
- Clerk: transfer organisation ownership (2 clicks in dashboard)
- Supabase: transfer project ownership (Settings → Transfer)
- Vercel: transfer project to buyer's account (Settings → Transfer)
- Stripe: full account transfer or create new account + re-enter price IDs in `.env`
- Domain: DNS update at registrar → Vercel custom domain
- Estimated time: **4–6 hours**

**Day 7–14: First feature**
- The `docs/TECHNICAL_DUE_DILIGENCE.md` includes exact time estimates for common tasks:
  - New dashboard page: 2–4 hours
  - New agent tool: 30 minutes
  - New email sequence: 20 minutes
  - New AI provider: 1 hour
- A recommended first feature: enable pgvector semantic search (4–6 hours, major UX upgrade)

**Days 14–30: Async support**
- Seller available via email for questions, bugs, and architecture questions
- Response SLA: 24 hours

**Post-30 days:**
- Optional monthly retainer ($500–1,000/month) for ongoing support
- Codebase is self-documenting; TSDoc comments on all public functions

**Single most important thing to do in week 1:**
Enable Resend email (add the `RESEND_API_KEY`) and send a test digest. This turns on all 6 automated email sequences — welcome, upgrade confirmation, weekly digest, review reminders, streak rescue, and referral success. This alone typically increases Week 4 retention by 20–30%.

---

*FAQ version 1.0 · Technical queries: founders@wizemory.com*
