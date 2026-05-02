export const dynamic    = 'force-dynamic'
export const maxDuration = 30

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { answerFromKnowledge } from '@/lib/ai'
import { planGate, incrementAiCount, getAiCount, AI_QUERY_LIMIT_FREE } from '@/lib/gate'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── Gate: AI Q&A is Pro-only ─────────────────────────────────────────────
  const gate = planGate(user.plan)
  if (!gate.canUseAI) return gate.denyResponse('ai_qa')

  // ── FREE plan: enforce monthly query limit ───────────────────────────────
  if (user.plan === 'FREE') {
    const used = getAiCount(user.id)
    if (used >= AI_QUERY_LIMIT_FREE) {
      return NextResponse.json({
        error:   `Monthly AI limit reached (${AI_QUERY_LIMIT_FREE} queries/month on Free plan).`,
        upgrade: true,
        feature: 'ai_qa',
        used,
        limit:   AI_QUERY_LIMIT_FREE,
        cta:     'Upgrade to Pro for unlimited AI queries.',
        url:     '/pricing',
      }, { status: 403 })
    }
    incrementAiCount(user.id)
  }

  const body     = await req.json().catch(() => ({}))
  const question = body?.question?.trim()
  if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

  const items = await prisma.item.findMany({
    where:   { userId: user.id, status: 'READY' },
    orderBy: { createdAt: 'desc' },
    take:    30,
    select:  { title: true, summary: true, keyInsights: true, tags: true, createdAt: true, url: true },
  })

  if (items.length === 0) {
    return NextResponse.json({
      answer: "You haven't saved any items yet. Save an article or note first, then ask me anything about it!",
    })
  }

  try {
    const answer = await answerFromKnowledge(question, items)
    return NextResponse.json({ answer, queriesUsed: user.plan === 'FREE' ? getAiCount(user.id) : null })
  } catch (err: any) {
    console.error('[chat] AI error:', err?.message)
    return NextResponse.json({ answer: 'AI temporarily unavailable. Please try again in a moment.' })
  }
}
