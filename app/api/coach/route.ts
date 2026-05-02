export const dynamic    = 'force-dynamic'
export const maxDuration = 60

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const GEMINI_KEY = process.env.GEMINI_API_KEY ?? ''
const GROQ_KEY   = process.env.GROQ_API_KEY ?? ''

async function callAI(prompt: string): Promise<string> {
  if (GEMINI_KEY) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 800, temperature: 0.6 } }),
      })
      if (r.ok) { const d = await r.json(); return d?.candidates?.[0]?.content?.parts?.[0]?.text ?? '' }
    } catch {}
  }
  if (GROQ_KEY) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 800 }),
    })
    if (r.ok) { const d = await r.json(); return d?.choices?.[0]?.message?.content ?? '' }
  }
  return ''
}

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = new Date()

  const [overdueItems, recentItems, tagCounts] = await Promise.all([
    prisma.item.findMany({
      where: { userId: user.id, status: 'READY', nextReviewAt: { lte: now } },
      orderBy: { nextReviewAt: 'asc' },
      take: 5,
      select: { id: true, title: true, tags: true, reviewCount: true, nextReviewAt: true },
    }),
    prisma.item.findMany({
      where: { userId: user.id, status: 'READY', createdAt: { gte: new Date(now.getTime() - 7 * 86400000) } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { title: true, tags: true, keyInsights: true },
    }),
    prisma.item.findMany({
      where: { userId: user.id, status: 'READY' },
      select: { tags: true },
      take: 100,
    }),
  ])

  const tagFreq: Record<string, number> = {}
  tagCounts.forEach(i => i.tags.forEach(t => { tagFreq[t] = (tagFreq[t] ?? 0) + 1 }))
  const topTopics = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t)

  const recentTitles = recentItems.map(i => `- ${i.title}`).join('\n')
  const overdueTitles = overdueItems.map(i => `- ${i.title} (reviewed ${i.reviewCount}×)`).join('\n')

  const prompt = `You are an AI Memory Coach. Analyze this learner's recent activity and give a brief, personalized daily coaching message.

Recent saves (last 7 days):
${recentTitles || 'Nothing saved recently'}

Items overdue for review:
${overdueTitles || 'None overdue'}

Top topics: ${topTopics.join(', ') || 'varied'}
Streak: ${user.streak} days

Return JSON only, no markdown:
{
  "greeting": "1 short motivating sentence (mention their name if available)",
  "focus": "What they should focus on today (1 sentence)",
  "insight": "One interesting pattern or gap you notice in their knowledge (1-2 sentences)",
  "action": "The single most important thing to do today",
  "blindspot": "A topic they might be missing based on their interests"
}`

  let coaching = {
    greeting: `Good morning! You have ${overdueItems.length} items to review today.`,
    focus: overdueItems.length > 0 ? 'Clear your review queue before saving anything new.' : 'Keep building your knowledge base consistently.',
    insight: topTopics.length > 0 ? `You've been focused on ${topTopics.slice(0, 2).join(' and ')}. Try branching into related areas.` : 'Start saving items across different topics to build connections.',
    action: overdueItems.length > 0 ? `Review "${overdueItems[0]?.title}"` : 'Save one new article today',
    blindspot: 'Consider exploring topics adjacent to your current interests',
  }

  if (GEMINI_KEY || GROQ_KEY) {
    try {
      const raw = await callAI(prompt)
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) coaching = { ...coaching, ...JSON.parse(match[0]) }
    } catch {}
  }

  return NextResponse.json({
    coaching,
    reviewDue:   overdueItems.length,
    reviewItems: overdueItems,
    streak:      user.streak,
    topTopics,
  })
}
