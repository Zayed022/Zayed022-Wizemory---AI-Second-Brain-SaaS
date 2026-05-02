export const dynamic    = 'force-dynamic'
export const maxDuration = 60

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { planGate } from '@/lib/gate'

const GEMINI_KEY = process.env.GEMINI_API_KEY ?? ''
const GROQ_KEY   = process.env.GROQ_API_KEY   ?? ''

async function callAI(prompt: string, system: string, maxTokens = 2000): Promise<string> {
  if (GEMINI_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${system}\n\n${prompt}` }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
          }),
        }
      )
      if (res.ok) {
        const d = await res.json()
        return d?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      }
    } catch {}
  }
  if (GROQ_KEY) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_tokens: maxTokens, temperature: 0.7 }),
    })
    if (res.ok) { const d = await res.json(); return d?.choices?.[0]?.message?.content ?? '' }
  }
  throw new Error('AI unavailable')
}

const FORMATS: Record<string, { label: string; system: string }> = {
  twitter_thread: {
    label: 'Twitter thread',
    system: 'You are an expert social media writer. Create an engaging Twitter/X thread. Start with a hook tweet, then 4-6 numbered tweets with insights, end with a call to action. Format: "1/ [tweet]\\n\\n2/ [tweet]" etc. Each tweet max 280 chars.',
  },
  blog_post: {
    label: 'Blog post',
    system: 'You are an expert blog writer. Create a well-structured, engaging blog post with: catchy title, introduction, 3-4 main sections with headers, key takeaways, and conclusion. Aim for 600-800 words.',
  },
  linkedin_post: {
    label: 'LinkedIn post',
    system: 'You are an expert LinkedIn content creator. Write a professional, insightful LinkedIn post. Start with a bold hook (no "I"), use line breaks for readability, include 3-5 insights, end with a question. Max 1300 chars.',
  },
  email_newsletter: {
    label: 'Email newsletter',
    system: 'You are an expert email marketer. Write a newsletter section with: compelling subject line, brief intro, 3 key insights from the knowledge, one actionable tip, and a sign-off. Professional but warm tone.',
  },
  summary_doc: {
    label: 'Summary document',
    system: 'You are an expert knowledge synthesiser. Create a structured summary document with: Executive Summary, Key Themes, Important Insights, Recommendations, and Next Steps. Use markdown formatting.',
  },
  study_notes: {
    label: 'Study notes',
    system: 'You are an expert educator. Create comprehensive study notes with: main concepts, definitions, examples, and quiz questions at the end. Use markdown with headers and bullet points.',
  },
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const gate = planGate(user.plan)
  if (!gate.canUseWrite) return gate.denyResponse('write')

  const { topic, format, tags } = await req.json()
  if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 })

  const formatConfig = FORMATS[format] ?? FORMATS.blog_post

  // Fetch relevant saved knowledge
  const items = await prisma.item.findMany({
    where: {
      userId: user.id,
      status: 'READY',
      ...(tags?.length ? { tags: { hasSome: tags } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
    select: { title: true, summary: true, keyInsights: true, tags: true },
  })

  if (items.length === 0) {
    return NextResponse.json({ error: 'No saved knowledge found. Save some articles first!' }, { status: 400 })
  }

  const context = items.map((item, i) =>
    `[${i+1}] "${item.title}"\nSummary: ${item.summary ?? 'N/A'}\nInsights: ${item.keyInsights.join(' · ')}`
  ).join('\n\n')

  const prompt = `Topic to write about: "${topic}"

My saved knowledge base (use this to enrich the content):
${context}

Write the ${formatConfig.label} using insights from my knowledge base. Make it specific, insightful, and based on the actual content I've saved.`

  const content = await callAI(prompt, formatConfig.system, 2000)

  return NextResponse.json({ content, format, topic, usedItems: items.length })
}
