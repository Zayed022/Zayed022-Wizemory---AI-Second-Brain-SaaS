/**
 * lib/agent/tools.ts
 *
 * Built-in tool registry for the WizeMory Agent.
 *
 * Every tool is:
 *   - Self-documenting (description used by the model to decide when to call it)
 *   - Pure async (no side effects beyond their declared purpose)
 *   - Independently testable
 *
 * To add a new tool: push a ToolDefinition to this array.
 * The AgentEngine picks it up automatically — no engine changes needed.
 */

import type { ToolDefinition, ToolResult, AgentContext } from './engine'
import { extractFromUrl, summariseItem, answerFromKnowledge } from '../ai'

export const MEMORA_TOOLS: ToolDefinition[] = [

  // ── 1. Fetch & Summarise URL ────────────────────────────────────────────────
  {
    name:        'summarise_url',
    description: 'Fetch a webpage or YouTube URL and return an AI-generated summary with key insights and tags. Use this when the user provides a URL to summarise.',
    parameters: {
      url:   { type: 'string', description: 'The URL to fetch and summarise', required: true },
      label: { type: 'string', description: 'Optional label for this item (e.g. "research article", "product demo")', required: false },
    },
    execute: async (params, ctx: AgentContext): Promise<ToolResult> => {
      const { url, label } = params
      try {
        const content = await extractFromUrl(url)
        if (!content || content.length < 50) {
          return { success: false, output: '', error: `Could not extract content from ${url}` }
        }

        const result = await summariseItem(content, 'ARTICLE', url)

        return {
          success: true,
          output:  `Summarised "${result.title}": ${result.summary} Key insights: ${result.keyInsights.join(' | ')}`,
          data:    { title: result.title, summary: result.summary, keyInsights: result.keyInsights, tags: result.tags, url },
        }
      } catch (err: any) {
        return { success: false, output: '', error: err?.message ?? 'Failed to summarise URL' }
      }
    },
  },

  // ── 2. Save Item to Knowledge Base ─────────────────────────────────────────
  {
    name:        'save_to_knowledge_base',
    description: 'Save a piece of content (summary, note, or insight) permanently to the user\'s WizeMory knowledge base. Use after summarising to persist the knowledge.',
    parameters: {
      title:       { type: 'string',  description: 'Title of the item to save',                   required: true  },
      content:     { type: 'string',  description: 'The content or summary to save',              required: true  },
      type:        { type: 'string',  description: 'Item type: ARTICLE, NOTE, BOOKMARK, YOUTUBE', required: false },
      url:         { type: 'string',  description: 'Source URL if applicable',                    required: false },
      tags:        { type: 'string',  description: 'Comma-separated tags',                        required: false },
      keyInsights: { type: 'string',  description: 'Pipe-separated key insights',                 required: false },
    },
    execute: async (params, ctx: AgentContext): Promise<ToolResult> => {
      const { title, content, type, url, tags, keyInsights } = params
      try {
        const tagsArr    = tags        ? tags.split(',').map((t: string) => t.trim())         : []
        const insightsArr = keyInsights ? keyInsights.split('|').map((i: string) => i.trim()) : []

        const item = await ctx.prisma.item.create({
          data: {
            userId:      ctx.userId,
            type:        type ?? 'NOTE',
            title:       title.slice(0, 200),
            url:         url ?? null,
            rawContent:  content,
            summary:     content.slice(0, 500),
            keyInsights: insightsArr,
            tags:        tagsArr,
            status:      'READY',
          },
        })

        await ctx.prisma.user.update({ where: { id: ctx.userId }, data: { itemCount: { increment: 1 } } })

        return {
          success: true,
          output:  `Saved "${title}" to your knowledge base with ID ${item.id}`,
          data:    { itemId: item.id, title },
        }
      } catch (err: any) {
        return { success: false, output: '', error: err?.message ?? 'Failed to save item' }
      }
    },
  },

  // ── 3. Search Knowledge Base ─────────────────────────────────────────────────
  {
    name:        'search_knowledge_base',
    description: 'Search the user\'s saved knowledge base for items matching a topic, tag, or keyword. Returns relevant summaries and insights.',
    parameters: {
      query: { type: 'string', description: 'Search query — topic, keyword, or question', required: true },
      limit: { type: 'number', description: 'Max results to return (default 5)',          required: false },
    },
    execute: async (params, ctx: AgentContext): Promise<ToolResult> => {
      const { query, limit = 5 } = params
      try {
        const q = String(query).toLowerCase()

        const items = await ctx.prisma.item.findMany({
          where: {
            userId: ctx.userId,
            status: 'READY',
            OR: [
              { title:   { contains: q, mode: 'insensitive' } },
              { summary: { contains: q, mode: 'insensitive' } },
              { tags:    { has: q } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take:    Number(limit),
          select:  { id: true, title: true, summary: true, keyInsights: true, tags: true, url: true },
        })

        if (items.length === 0) {
          return { success: true, output: `No items found for "${query}" in knowledge base.`, data: { items: [] } }
        }

        const formatted = items.map((i: any, n: number) =>
          `[${n+1}] "${i.title}"\n  Summary: ${i.summary?.slice(0, 200) ?? 'N/A'}\n  Insights: ${i.keyInsights.slice(0, 2).join(' | ')}`
        ).join('\n\n')

        return {
          success: true,
          output:  `Found ${items.length} items for "${query}":\n\n${formatted}`,
          data:    { items, count: items.length },
        }
      } catch (err: any) {
        return { success: false, output: '', error: err?.message ?? 'Search failed' }
      }
    },
  },

  // ── 4. Ask Knowledge Base (AI Q&A) ─────────────────────────────────────────
  {
    name:        'ask_knowledge_base',
    description: 'Ask a question and get an AI answer grounded in the user\'s saved knowledge. Best for synthesising across multiple items.',
    parameters: {
      question: { type: 'string', description: 'The question to answer from saved knowledge', required: true },
    },
    execute: async (params, ctx: AgentContext): Promise<ToolResult> => {
      const { question } = params
      try {
        const items = await ctx.prisma.item.findMany({
          where:   { userId: ctx.userId, status: 'READY' },
          orderBy: { createdAt: 'desc' },
          take:    20,
          select:  { title: true, summary: true, keyInsights: true, tags: true, createdAt: true },
        })

        const answer = await answerFromKnowledge(question, items)

        return {
          success: true,
          output:  answer,
          data:    { question, answer, itemsUsed: items.length },
        }
      } catch (err: any) {
        return { success: false, output: '', error: err?.message ?? 'Q&A failed' }
      }
    },
  },

  // ── 5. Generate LinkedIn Post ────────────────────────────────────────────────
  {
    name:        'generate_linkedin_post',
    description: 'Write a professional LinkedIn post based on provided content, summaries, or insights from the knowledge base.',
    parameters: {
      topic:   { type: 'string', description: 'The topic or theme for the post',                required: true  },
      context: { type: 'string', description: 'Content, summaries, or insights to draw from',  required: false },
      tone:    { type: 'string', description: 'Tone: professional, casual, thought-provoking',  required: false },
    },
    execute: async (params, ctx: AgentContext): Promise<ToolResult> => {
      const { topic, context, tone = 'professional' } = params
      try {
        const prompt = `Write a ${tone} LinkedIn post about: "${topic}"

${context ? `Draw from this content:\n${context}\n\n` : ''}

Rules:
- Start with a bold hook (not "I")
- 4-6 short paragraphs, line breaks between each
- Include 2-3 specific insights or data points
- End with a question to drive engagement
- Add 3-5 relevant hashtags at the end
- Max 1,200 characters
- No emoji (professional tone)`

        const post = await ctx.callAI(prompt, 'You are an expert LinkedIn content creator.', 600)

        return {
          success: true,
          output:  post,
          data:    { type: 'linkedin_post', topic, content: post },
        }
      } catch (err: any) {
        return { success: false, output: '', error: err?.message ?? 'Post generation failed' }
      }
    },
  },

  // ── 6. Generate Twitter Thread ───────────────────────────────────────────────
  {
    name:        'generate_twitter_thread',
    description: 'Write a Twitter/X thread with hook, numbered tweets, and CTA. Best for sharing insights from researched content.',
    parameters: {
      topic:   { type: 'string', description: 'Thread topic',                              required: true  },
      context: { type: 'string', description: 'Summaries or insights to draw from',        required: false },
      tweets:  { type: 'number', description: 'Number of tweets in thread (default: 6)',   required: false },
    },
    execute: async (params, ctx: AgentContext): Promise<ToolResult> => {
      const { topic, context, tweets = 6 } = params
      try {
        const prompt = `Write a ${tweets}-tweet Twitter/X thread about: "${topic}"

${context ? `Based on this research:\n${context}\n\n` : ''}

Format:
1/ [Hook tweet — bold claim or surprising fact, max 280 chars]
2/ [Context or problem]
3/ [Key insight 1]
...
${tweets}/ [Actionable takeaway + follow CTA]

Each tweet max 280 chars. Number each tweet. Make it educational and shareable.`

        const thread = await ctx.callAI(prompt, 'You are an expert Twitter/X content creator. Write viral educational threads.', 800)

        return {
          success: true,
          output:  thread,
          data:    { type: 'twitter_thread', topic, content: thread, tweetCount: tweets },
        }
      } catch (err: any) {
        return { success: false, output: '', error: err?.message ?? 'Thread generation failed' }
      }
    },
  },

  // ── 7. Draft Email ───────────────────────────────────────────────────────────
  {
    name:        'draft_email',
    description: 'Draft a professional email based on a brief, context, or knowledge base content.',
    parameters: {
      subject:  { type: 'string', description: 'Email subject or purpose',               required: true  },
      context:  { type: 'string', description: 'Context, content, or key points',        required: false },
      to:       { type: 'string', description: 'Recipient type (e.g. "investor", "user")', required: false },
      tone:     { type: 'string', description: 'Tone: formal, friendly, urgent',         required: false },
    },
    execute: async (params, ctx: AgentContext): Promise<ToolResult> => {
      const { subject, context, to, tone = 'professional' } = params
      try {
        const prompt = `Draft a ${tone} email with subject: "${subject}"

${to ? `Recipient: ${to}\n` : ''}
${context ? `Context/key points:\n${context}\n` : ''}

Write a complete email with:
- Subject line
- Greeting
- 2-3 body paragraphs
- Clear call to action
- Professional sign-off

Be concise and specific.`

        const email = await ctx.callAI(prompt, 'You are an expert email writer. Write clear, compelling emails.', 600)

        return {
          success: true,
          output:  email,
          data:    { type: 'email', subject, content: email },
        }
      } catch (err: any) {
        return { success: false, output: '', error: err?.message ?? 'Email generation failed' }
      }
    },
  },

  // ── 8. Create Study Summary ──────────────────────────────────────────────────
  {
    name:        'create_study_summary',
    description: 'Create structured study notes with concepts, definitions, and quiz questions from saved content.',
    parameters: {
      topic:   { type: 'string', description: 'Topic to create study notes for',        required: true  },
      context: { type: 'string', description: 'Content or summaries to study',          required: false },
    },
    execute: async (params, ctx: AgentContext): Promise<ToolResult> => {
      const { topic, context } = params
      try {
        const prompt = `Create comprehensive study notes for: "${topic}"

${context ? `Based on:\n${context}\n\n` : ''}

Structure:
# Key Concepts
[List each main concept with a 1-sentence definition]

# Core Insights
[3-5 most important things to remember]

# Connections
[How these ideas relate to each other]

# Quiz Yourself
[5 questions to test understanding]

Be specific and actionable.`

        const notes = await ctx.callAI(prompt, 'You are an expert educator. Create clear, memorable study materials.', 1000)

        return {
          success: true,
          output:  notes,
          data:    { type: 'study_notes', topic, content: notes },
        }
      } catch (err: any) {
        return { success: false, output: '', error: err?.message ?? 'Study summary failed' }
      }
    },
  },
]
