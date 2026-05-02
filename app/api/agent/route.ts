export const dynamic    = 'force-dynamic'
export const maxDuration = 120

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AgentEngine } from '@/lib/agent/engine'
import { MEMORA_TOOLS } from '@/lib/agent/tools'
import { planGate } from '@/lib/gate'

async function callAI(prompt: string, system?: string, maxTokens = 1024): Promise<string> {
  const GEMINI_KEY = process.env.GEMINI_API_KEY ?? ''
  const GROQ_KEY   = process.env.GROQ_API_KEY   ?? ''

  if (GEMINI_KEY) {
    try {
      const body: any = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
      }
      if (system) body.system_instruction = { parts: [{ text: system }] }
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20_000) }
      )
      if (r.ok) { const d = await r.json(); return d?.candidates?.[0]?.content?.parts?.[0]?.text ?? '' }
    } catch {}
  }
  if (GROQ_KEY) {
    const msgs: any[] = system ? [{ role: 'system', content: system }] : []
    msgs.push({ role: 'user', content: prompt })
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: msgs, max_tokens: maxTokens }),
    })
    if (r.ok) { const d = await r.json(); return d?.choices?.[0]?.message?.content ?? '' }
  }
  throw new Error('AI_UNAVAILABLE')
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── Gate: Agent is Pro-only ──────────────────────────────────────────────
  const gate = planGate(user.plan)
  if (!gate.canUseAgent) return gate.denyResponse('agent')

  const { goal } = await req.json()
  if (!goal?.trim()) return NextResponse.json({ error: 'goal is required' }, { status: 400 })
  if (goal.length > 1000) return NextResponse.json({ error: 'Goal too long (max 1000 chars)' }, { status: 400 })

  const ctx = { userId: user.id, userPlan: user.plan, prisma, callAI }
  const engine = new AgentEngine(ctx, MEMORA_TOOLS)
  const run    = await engine.run(goal.trim())

  prisma.userStats.upsert({
    where:  { userId: user.id },
    update: { totalAiQueries: { increment: 1 } },
    create: { userId: user.id, totalAiQueries: 1 },
  }).catch(() => {})

  return NextResponse.json(run)
}

export async function GET() {
  const tools = MEMORA_TOOLS.map(t => ({
    name: t.name, description: t.description, paramCount: Object.keys(t.parameters).length,
  }))
  return NextResponse.json({ tools, totalTools: tools.length })
}
