# Acquire.com Listing — Executive Summary + Seller Pitch

---

## PART 1: ACQUIRE.COM EXECUTIVE SUMMARY (300 words)

> Paste this directly into the Acquire.com listing description field.

---

**WizeMory — AI Second Brain SaaS | $0/mo Infra | Agentic AI | GDPR-Ready**

WizeMory is a production-deployed AI knowledge management SaaS with a technical architecture no weekend-builder can replicate: a native Gemini function-calling agentic loop, a live D3 knowledge graph, spaced repetition, and a GDPR-compliant PII detection layer — all running on $0/month in infrastructure.

**The core product:** Users paste any URL, YouTube link, or note. In under 20 seconds, AI reads the full content, writes a summary, extracts key insights, tags everything, and connects it to their entire knowledge base automatically. No manual organisation required. They ask questions in plain English and get answers from their own research — not the internet.

**What makes this defensible:**

The agentic task runner is built on Gemini native function calling (not prompt hacking). It chains up to 10 tool calls — summarise URLs, search the knowledge base, generate LinkedIn posts, draft emails — from a single natural-language command. This is engineering that takes months, not weeks.

The infrastructure costs $0 at launch: Gemini free tier processes every item, Supabase free handles 5K users, Vercel free deploys automatically. Gross margin is 95%+ from subscriber #1.

**What you get:**
- 130 production files, ~15,000 lines of TypeScript
- 4 revenue tiers: Free / Pro ($12) / Team ($49/user) / Business ($199)
- 3 automated cron jobs (digest, review reminders, streak rescue)
- 6 email sequences, browser extension, referral system, affiliate dashboard
- 5 SEO tool pages targeting high-volume keywords
- Full GDPR compliance (PII detection, consent logging, Art 17 erasure)
- 30-day hands-on buyer handoff included

**Ask:** $100,000

A senior engineer costs $120K/year. This is a complete, deployed, monetisable SaaS for less.

Demo: wizemory.com/demo | Metrics: wizemory.com/founder

---

---

## PART 2: SELLER'S PITCH — 15-MINUTE ZOOM SCRIPT

> Use this for live calls with interested buyers. Times are targets, not hard stops.
> Have `wizemory.com/demo` and `wizemory.com/founder` open in other tabs before the call.

---

### Pre-call setup (5 minutes before)

Open these tabs in this order:
1. `wizemory.com/demo` — set plan switcher to PRO
2. `wizemory.com/founder` — scroll to valuation banner
3. `wizemory.com/pricing` — visible for reference
4. `/dashboard/graph` — in your own account, not demo
5. `/dashboard/agent` — ready to show a live run

Have the Acquire.com listing open on your phone as a reference.

---

### [0:00–1:00] — The opener

> *Don't pitch immediately. Open with a question.*

**SAY:**

"Before I walk you through anything — can I ask what caught your attention about the listing? Was it the technical side, the revenue potential, or something else?"

*Listen fully. This tells you whether to lean technical (CTO-type buyer) or business (operator-type buyer) for the rest of the call.*

**Then:**

"Perfect. Let me show you exactly what you'd be buying, and I want to make sure I spend time on what matters most to you. We've got 15 minutes so I'll keep it tight."

---

### [1:00–4:00] — The product demo (3 minutes)

*Share your screen. Go to `wizemory.com/demo`.*

**SAY:**

"This is the live demo. Let me show you the three things that make WizeMory different."

**[30 seconds — The Save]**
"A user pastes any URL here. No thinking required. In the background, AI reads the entire article — not just the headline — and extracts a summary and insights automatically. This is the core loop. Save, AI processes, done."

**[30 seconds — The AI Q&A]**
"Now they ask a question from their own knowledge base. Not Google. Their research. The answer is grounded in what they've actually saved. This is what turns saving into knowing."

**[30 seconds — Plan switcher]**
Click FREE → PRO → TEAM in the banner.

"Notice how the experience changes. Free users see the limit, the upgrade prompt, the locked features. Pro users get the graph, the digest, the agent. This gating is enforced at the API level — you can't bypass it with a direct fetch."

**[30 seconds — The graph]**
Switch to `/dashboard/graph` tab.

"This is the knowledge graph. Every node is something the user saved. Every edge is a connection — either tag-based or AI-discovered. It updates automatically every time they save something new. D3 force-directed physics, cluster grouping, AI explanation panel. No other knowledge tool has this."

---

### [4:00–7:00] — The technical moat (3 minutes)

*This is what justifies the price to a technical buyer.*

**SAY:**

"Let me show you the thing that took the most engineering time to build — and the reason I believe the asking price is conservative."

*Go to `/dashboard/agent`.*

"This is the AI Agent. It uses Gemini's native function calling — not prompt hacking. I give it a goal in plain English: 'summarise these three URLs, find connections in my knowledge base, write a LinkedIn post.' It breaks that into tool calls, executes them in sequence, feeds each result back to the model, and returns a complete answer."

"There are 8 built-in tools. Adding a new one is one object in an array — zero engine changes. I've clocked it at 30 minutes for a developer to add a new capability."

"The infrastructure cost to run all of this is zero dollars. Gemini free tier, Supabase free, Vercel free. At 500 Pro subscribers — $6K MRR — the total infra spend is under $50 a month. That's a 99% gross margin."

*If buyer seems technical:*

"The processing pipeline has a 55-second hard timeout, Gemini→Groq waterfall fallback, and always resolves to READY or FAILED — never stuck in PROCESSING. Items are processed inline in the same Vercel function, not via fire-and-forget. The old approach left items stuck; this was the first thing I fixed."

---

### [7:00–9:00] — The numbers (2 minutes)

*Go to `wizemory.com/founder`.*

**SAY:**

"This is the founder dashboard. It loads real metrics when you authenticate with the admin secret — I'll share that with you in due diligence. Demo data shows what the dashboard looks like at scale."

*Point to the valuation banner.*

"Conservative at 3× ARR, optimistic at 8×. The recommended ask is $175K at demo-data scale. I'm pricing this at $100K because I want a clean transaction, not an auction."

"The path to making this worthwhile: one Product Hunt launch typically brings 500–2,000 signups. At 10% conversion that's 50–200 Pro subscribers — $600 to $2,400 MRR — in the first week. At $2,400 MRR you've recovered 29% of your investment in month one."

"The B2B upside is what I haven't had time to touch. One 10-person company on the Team plan is $490/month. Five companies is $2,450 MRR — before a single individual subscriber."

---

### [9:00–11:00] — The handoff (2 minutes)

**SAY:**

"I want to address the thing most buyers are worried about: 'what if I get stuck after the transaction?' I've built a 30-day handoff schedule, day by day, that covers every account transfer, every test, and your first feature ship."

"Week 1 is pure setup — database, auth, payments, domain. By end of week 1 you'll have processed a real payment and seen the plan update in the database. Week 2 is a full code walkthrough with me. Week 3 you ship your first feature. Week 4 I step back."

"I remain available by email for 30 days post-handoff, 24-hour response. If you want an ongoing retainer after that, it's available."

"The only skill you need is intermediate Next.js and TypeScript. If you have that — or a developer who does — you can operate this day one."

---

### [11:00–13:00] — Handle objections

**Common objections and exact responses:**

---

**"$100K is too much without revenue."**

"I understand. Let me reframe: you're not buying revenue — you're buying $150K–$300K of engineering that would take 6–12 months to rebuild from scratch. A senior TypeScript developer costs $100K/year. This is the same price, and it's already built, deployed, and monetisation-ready. The risk is your time to grow it — and that risk exists whether you build or buy."

---

**"What if users don't convert from free to paid?"**

"That's the right question. The conversion levers are built in: the plan gate shows a clear upgrade prompt with specific feature names, not a generic 'upgrade now.' The AI agent and knowledge graph are the features users want most — and they require Pro. The weekly digest email, which is one of the highest-engagement retention features, is also Pro-only. These aren't arbitrary restrictions — they're the features that create daily habit."

---

**"What happens when Gemini free tier runs out?"**

"At 1,500 requests per day free, you'd need roughly 750 daily active users saving 2 items each to hit the limit. At that scale you'd have $9,000+ in MRR. The paid Gemini API costs $0.35 per million tokens — a typical item summary uses about 2,000 tokens, so $0.0007 per item. You'd spend $7/day at 10,000 items/day. The gross margin stays above 90%."

---

**"Can I see real users and real data?"**

"You can see the DB structure and all schema in the due diligence doc, and I'll share read access to the Supabase project in due diligence. The founder dashboard loads real metrics when you hit it with the admin secret — I'll share that on a follow-up call after signing an NDA."

---

**"I'm worried about the technical complexity."**

"The extensibility is designed for this worry. The due diligence doc has time estimates for every common task: new dashboard page is 2–4 hours, new agent tool is 30 minutes, new email sequence is 20 minutes. I've included a 30-day handoff schedule where Week 3 is specifically 'ship your first feature' — so you prove to yourself you can extend it before the handoff ends."

---

### [13:00–15:00] — The close

**SAY:**

"Here's what I'd propose as a next step. I'll send you the full technical due diligence document and the 30-day handoff schedule today — you can read through them this week. If you want to proceed, we sign an NDA, I share full database access and the codebase tour Loom, and we schedule a 90-minute technical deep-dive with your developer if you have one."

"The transaction structure I prefer is 50% on signing, 50% on successful handoff at Day 7 — when you've confirmed the database, auth, AI, and payments are all running under your accounts. That protects both of us."

"Do you have a developer you'd want to bring into the technical review, or would you be evaluating it yourself?"

*Listen. Schedule next step before hanging up.*

---

### Post-call follow-up (send within 2 hours)

Email subject: `WizeMory — documents + next steps`

```
Hi [Name],

Great to connect. As promised:

1. Technical due diligence: [Notion link or PDF]
2. 30-day handoff schedule: [attachment or link]
3. Stripe setup guide: [attachment or link]
4. Live demo: wizemory.com/demo
5. Founder metrics: wizemory.com/founder

My suggested next step: you review the due diligence this week,
come back with any technical questions, and we schedule a 30-minute
follow-up — ideally with your developer on the call.

If you want to move faster, I can share full DB read access after
a simple NDA (1 page, standard).

Let me know what works.

[Your name]
founders@wizemory.com
```

---

### What NOT to say

- Don't say "it's easy to maintain" — say "the handoff plan covers everything"
- Don't say "the code is perfect" — say "the architecture is extensible and well-documented"
- Don't say "it will definitely grow" — say "the growth levers are built in and ready to activate"
- Don't mention prior failed attempts at growth — focus on what's built and what's possible
- Don't apologise for the price — state it confidently and explain the value

---

*Script version 1.0 — practice it twice before the first call.*
*The opener question is the most important line. Don't skip it.*
