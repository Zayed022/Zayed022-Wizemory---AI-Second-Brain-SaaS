/**
 * lib/ai.ts — FREE AI using Google Gemini + Groq fallback
 * Keys are read fresh on every call (not cached at module load)
 * so hot-reloads and Vercel env changes take effect immediately.
 */

async function callAI(prompt: string, systemPrompt?: string, maxTokens = 1024): Promise<string> {
  const GEMINI_KEY = process.env.GEMINI_API_KEY ?? ''
  const GROQ_KEY   = process.env.GROQ_API_KEY   ?? ''

  if (!GEMINI_KEY && !GROQ_KEY) {
    console.error('[ai] No API keys found. Set GEMINI_API_KEY or GROQ_API_KEY in .env.local')
    throw new Error('AI_UNAVAILABLE')
  }

  // Try Gemini models in order
  if (GEMINI_KEY) {
    const geminiModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    for (const model of geminiModels) {
      try {
        const result = await callGemini(prompt, systemPrompt, maxTokens, model, GEMINI_KEY)
        if (result) return result
      } catch (err: any) {
        const isRateLimit = err?.status === 429
          || String(err?.message).includes('429')
          || String(err?.message).toLowerCase().includes('quota')
          || String(err?.message).toLowerCase().includes('rate')
        if (!isRateLimit) {
          console.error(`[ai] Gemini ${model} error:`, err?.message)
          break // non-rate-limit error — don't try other Gemini models
        }
        console.warn(`[ai] Gemini ${model} rate limited, trying next…`)
      }
    }
  }

  // Try Groq models in order
  if (GROQ_KEY) {
    const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']
    for (const model of groqModels) {
      try {
        const result = await callGroq(prompt, systemPrompt, maxTokens, model, GROQ_KEY)
        if (result) return result
      } catch (err: any) {
        const isRateLimit = err?.status === 429
          || String(err?.message).includes('rate_limit')
          || String(err?.message).includes('429')
        if (!isRateLimit) {
          console.error(`[ai] Groq ${model} error:`, err?.message)
          break
        }
        console.warn(`[ai] Groq ${model} rate limited, trying next…`)
      }
    }
  }

  throw new Error('AI_UNAVAILABLE')
}

async function callGemini(
  prompt: string,
  systemPrompt: string | undefined,
  maxTokens: number,
  model: string,
  apiKey: string
): Promise<string> {
  const body: any = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
  }
  if (systemPrompt) {
    body.system_instruction = { parts: [{ text: systemPrompt }] }
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    }
  )

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    const msg = errBody?.error?.message ?? `Gemini HTTP ${res.status}`
    console.error('[ai] Gemini response error:', res.status, msg)
    const e: any = new Error(msg)
    e.status = res.status
    throw e
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text) console.warn('[ai] Gemini returned empty text for model:', model)
  return text
}

async function callGroq(
  prompt: string,
  systemPrompt: string | undefined,
  maxTokens: number,
  model: string,
  apiKey: string
): Promise<string> {
  const messages: any[] = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: prompt })

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.4 }),
    signal: AbortSignal.timeout(20_000),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    const msg = errBody?.error?.message ?? `Groq HTTP ${res.status}`
    const e: any = new Error(msg)
    e.status = res.status
    throw e
  }

  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
}

// ─── Public feature functions ─────────────────────────────────────────────────

export async function summariseItem(
  content: string,
  type: string,
  url?: string
): Promise<{ title: string; summary: string; keyInsights: string[]; tags: string[] }> {
  const hostname = url ? (() => { try { return new URL(url).hostname } catch { return '' } })() : ''

  const FALLBACK = {
    title:       hostname || content.slice(0, 60) || 'Untitled',
    summary:     content.slice(0, 250),
    keyInsights: [] as string[],
    tags:        [] as string[],
  }

  const prompt = `You are a knowledge extraction expert. Analyse this ${type.toLowerCase()} and return structured data.
${url ? `\nSource URL: ${url}` : ''}

CONTENT:
${content.slice(0, 6000)}

Return ONLY raw valid JSON — no markdown, no backticks, no explanation before or after:
{
  "title": "specific descriptive title under 80 chars",
  "summary": "2-3 sentences explaining the core idea and why it matters",
  "keyInsights": ["actionable insight 1", "actionable insight 2", "actionable insight 3"],
  "tags": ["topic1", "topic2", "topic3"]
}

Tags must be lowercase single words or hyphenated. Key insights must be specific.`

  try {
    const raw = await callAI(prompt, undefined, 700)

    // Strip any markdown fences
    const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()

    // Extract JSON object even if there's surrounding text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[ai] summariseItem: no JSON found in response:', raw.slice(0, 200))
      return FALLBACK
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate shape
    if (!parsed.title || !parsed.summary) return FALLBACK

    return {
      title:       String(parsed.title).slice(0, 100),
      summary:     String(parsed.summary),
      keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights.map(String) : [],
      tags:        Array.isArray(parsed.tags)        ? parsed.tags.map(String)        : [],
    }
  } catch (err: any) {
    if (err?.message !== 'AI_UNAVAILABLE') {
      console.error('[ai] summariseItem error:', err?.message)
    }
    return FALLBACK
  }
}

export async function answerFromKnowledge(
  question: string,
  items: Array<{ title: string; summary: string | null; keyInsights: string[]; tags: string[]; createdAt: Date }>
): Promise<string> {
  if (!items || items.length === 0) {
    return "You haven't saved any items yet. Click '+ Add' and save an article or note first!"
  }

  const context = items.slice(0, 20).map((item, i) => {
    const parts = [`[${i + 1}] ${item.title}`]
    if (item.summary) parts.push(`Summary: ${item.summary}`)
    if (item.tags?.length)        parts.push(`Tags: ${item.tags.join(', ')}`)
    if (item.keyInsights?.length) parts.push(`Key insights: ${item.keyInsights.join(' • ')}`)
    return parts.join('\n')
  }).join('\n\n')

  const system = `You are a helpful AI assistant who answers questions using the user's personal knowledge base.

RULES:
- Answer using the provided knowledge items
- Be helpful even with partial matches — infer meaning
- Reference item numbers like [1] or [2] when relevant
- Keep answers concise: 2-4 sentences
- If truly no relevant items exist, say what you DID find and suggest what they could save
- NEVER say "I cannot answer" or "no information found" — always provide value`

  const prompt = `QUESTION: ${question}

KNOWLEDGE BASE (${items.length} items):
${context}

Answer the question helpfully based on the knowledge base above.`

  try {
    const answer = await callAI(prompt, system, 500)
    if (!answer || answer.trim().length < 10) {
      return "I found your saved items but couldn't generate a clear answer. Try rephrasing your question."
    }
    return answer
  } catch (err: any) {
    if (err?.message === 'AI_UNAVAILABLE') {
      const keySet = !!(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY)
      return keySet
        ? 'AI is temporarily rate-limited. Please try again in a moment.'
        : 'AI is not configured. Please check your GEMINI_API_KEY in .env.local.'
    }
    return 'Something went wrong. Please try again.'
  }
}

export async function generateWeeklyDigest(
  items: Array<{ title: string; summary: string; tags: string[]; createdAt: Date }>,
  userName: string
): Promise<string> {
  const itemList = items.slice(0, 20).map(i =>
    `• "${i.title}" [${(i.tags || []).join(', ')}]`
  ).join('\n')

  const prompt = `Generate a warm, insightful weekly digest for ${userName}.

Items they saved this week:
${itemList}

Write 3-4 sentences covering:
1. The main recurring theme across their saves
2. One non-obvious connection between two items
3. One concrete actionable nudge based on their reading

Tone: intelligent and warm, like a thoughtful friend reviewing their notes.
Flowing prose only — no bullet points, no headers.`

  try {
    return await callAI(prompt, undefined, 450)
  } catch {
    return `You saved ${items.length} items this week. Keep building that knowledge base — great ideas compound over time.`
  }
}

export async function findConnections(
  items: Array<{ id: string; title: string; summary: string | null; tags: string[] }>
): Promise<Array<{ itemIds: string[]; title: string; description: string; strength: number }>> {
  if (items.length < 2) return []

  const itemList = items.slice(0, 20).map((i, idx) =>
    `[${idx}:${i.id}] "${i.title}"${i.summary ? ` — ${i.summary.slice(0, 100)}` : ''}`
  ).join('\n')

  const prompt = `Find the most meaningful conceptual connections between these knowledge items.

Items:
${itemList}

Return ONLY a valid JSON array (no markdown, no text before or after):
[
  {
    "itemIds": ["exact-id-1", "exact-id-2"],
    "title": "Connection title under 60 chars",
    "description": "One sentence explaining the conceptual bridge",
    "strength": 0.85
  }
]

Rules:
- Find 2-5 connections, strength must be ≥ 0.6
- Focus on non-obvious thematic connections
- Use EXACT IDs from the brackets (e.g. "cuid123abc")
- Return [] if no meaningful connections exist`

  try {
    const raw = await callAI(prompt, undefined, 700)
    const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (!match) return []
    return JSON.parse(match[0])
  } catch {
    return []
  }
}

export async function extractFromUrl(url: string): Promise<string> {
  // Jina Reader — free, no API key needed
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept':          'text/plain',
        'X-Return-Format': 'text',
        'X-Timeout':       '15',
      },
      signal: AbortSignal.timeout(18_000),
    })
    if (jinaRes.ok) {
      const text = await jinaRes.text()
      if (text && text.length > 100) {
        return text.slice(0, 50_000)
      }
    }
  } catch (e) {
    console.warn('[ai] Jina extraction failed:', (e as any)?.message)
  }

  // Fallback: direct fetch + strip HTML tags
  try {
    const directRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WizeMory/1.0; +https://wizemory.com)' },
      signal: AbortSignal.timeout(10_000),
    })
    if (directRes.ok) {
      const html = await directRes.text()
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim()
      if (text.length > 50) return text.slice(0, 50_000)
    }
  } catch (e) {
    console.warn('[ai] Direct fetch failed:', (e as any)?.message)
  }

  return ''
}
