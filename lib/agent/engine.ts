/**
 * lib/agent/engine.ts
 *
 * Agentic Task Runner for WizeMory.
 *
 * Architecture:
 *   1. User describes a multi-step workflow in plain English
 *   2. AgentEngine decomposes it into discrete tool calls via Gemini function calling
 *   3. Each tool is executed, its result fed back into the model context
 *   4. The loop continues until the model emits a final text response (no more tool calls)
 *   5. Full execution trace is returned for display + audit
 *
 * Extensibility:
 *   - Add new capabilities by pushing to TOOL_REGISTRY (no engine changes needed)
 *   - Each ToolDefinition is a pure async function; easy to unit test in isolation
 *   - AgentRun is serialisable JSON — store in DB, replay, or export for audits
 */

export interface ToolDefinition {
  name:        string
  description: string
  parameters:  Record<string, { type: string; description: string; required?: boolean }>
  execute:     (params: Record<string, any>, ctx: AgentContext) => Promise<ToolResult>
}

export interface ToolResult {
  success: boolean
  output:  string
  data?:   Record<string, any>
  error?:  string
}

export interface AgentContext {
  userId:    string
  userPlan:  string
  prisma:    any
  callAI:    (prompt: string, system?: string, maxTokens?: number) => Promise<string>
}

export interface AgentStep {
  stepNumber: number
  toolName:   string
  params:     Record<string, any>
  result:     ToolResult
  durationMs: number
  timestamp:  string
}

export interface AgentRun {
  id:           string
  userId:       string
  goal:         string
  status:       'running' | 'completed' | 'failed'
  steps:        AgentStep[]
  finalAnswer:  string
  totalTokens:  number
  durationMs:   number
  startedAt:    string
  completedAt:  string
}

const GEMINI_FUNC_CALLING_MODEL = 'gemini-1.5-flash'
const MAX_STEPS = 10

export class AgentEngine {
  private tools: Map<string, ToolDefinition> = new Map()
  private ctx:   AgentContext

  constructor(ctx: AgentContext, tools: ToolDefinition[]) {
    this.ctx = ctx
    tools.forEach(t => this.tools.set(t.name, t))
  }

  async run(goal: string): Promise<AgentRun> {
    const runId    = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const startedAt = new Date().toISOString()
    const steps:    AgentStep[] = []
    let   totalTokens = 0

    const geminiKey = process.env.GEMINI_API_KEY ?? ''
    const groqKey   = process.env.GROQ_API_KEY ?? ''

    try {
      // Build Gemini-format tool declarations
      const toolDeclarations = Array.from(this.tools.values()).map(t => ({
        name:        t.name,
        description: t.description,
        parameters: {
          type:       'OBJECT',
          properties: Object.fromEntries(
            Object.entries(t.parameters).map(([k, v]) => [k, { type: v.type.toUpperCase(), description: v.description }])
          ),
          required: Object.entries(t.parameters).filter(([, v]) => v.required).map(([k]) => k),
        },
      }))

      const messages: any[] = [
        {
          role:  'user',
          parts: [{ text: this.buildSystemPrompt() + '\n\nUser goal: ' + goal }],
        },
      ]

      let stepCount = 0

      while (stepCount < MAX_STEPS) {
        stepCount++

        // Call Gemini with function calling enabled
        const response = await this.callGeminiFunctionCalling(geminiKey, groqKey, messages, toolDeclarations)
        totalTokens   += response.tokensUsed ?? 0

        const candidate = response.candidates?.[0]
        if (!candidate) break

        const parts = candidate.content?.parts ?? []
        const textPart     = parts.find((p: any) => p.text)
        const funcCallPart = parts.find((p: any) => p.functionCall)

        // Model gave final text answer — done
        if (textPart && !funcCallPart) {
          const run: AgentRun = {
            id: runId, userId: this.ctx.userId, goal, status: 'completed',
            steps, finalAnswer: textPart.text,
            totalTokens, durationMs: Date.now() - new Date(startedAt).getTime(),
            startedAt, completedAt: new Date().toISOString(),
          }
          return run
        }

        // Model wants to call a tool
        if (funcCallPart?.functionCall) {
          const { name, args } = funcCallPart.functionCall
          const tool = this.tools.get(name)

          // Add model's function call to conversation
          messages.push({ role: 'model', parts: [{ functionCall: funcCallPart.functionCall }] })

          const stepStart = Date.now()
          let result: ToolResult

          if (!tool) {
            result = { success: false, output: '', error: `Unknown tool: ${name}` }
          } else {
            try {
              result = await tool.execute(args ?? {}, this.ctx)
            } catch (err: any) {
              result = { success: false, output: '', error: err?.message ?? 'Tool execution failed' }
            }
          }

          const step: AgentStep = {
            stepNumber: stepCount, toolName: name, params: args ?? {},
            result, durationMs: Date.now() - stepStart,
            timestamp: new Date().toISOString(),
          }
          steps.push(step)

          // Feed tool result back to model
          messages.push({
            role:  'user',
            parts: [{
              functionResponse: {
                name,
                response: { name, content: result.success ? result.output : `Error: ${result.error}` },
              },
            }],
          })
        } else {
          break
        }
      }

      // Fallback if max steps reached
      const finalText = `Completed ${steps.length} steps. ${steps.map(s => `✓ ${s.toolName}`).join(' → ')}`
      return {
        id: runId, userId: this.ctx.userId, goal, status: 'completed',
        steps, finalAnswer: finalText,
        totalTokens, durationMs: Date.now() - new Date(startedAt).getTime(),
        startedAt, completedAt: new Date().toISOString(),
      }
    } catch (err: any) {
      return {
        id: runId, userId: this.ctx.userId, goal, status: 'failed',
        steps, finalAnswer: '',
        totalTokens, durationMs: Date.now() - new Date(startedAt).getTime(),
        startedAt, completedAt: new Date().toISOString(),
      }
    }
  }

  private async callGeminiFunctionCalling(
    geminiKey: string, groqKey: string,
    messages: any[], tools: any[]
  ): Promise<any> {
    if (!geminiKey) return this.fallbackNoFunctionCalling(groqKey, messages)

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FUNC_CALLING_MODEL}:generateContent?key=${geminiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          contents: messages,
          tools:    [{ functionDeclarations: tools }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(30_000),
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `Gemini ${res.status}`)
    }

    return res.json()
  }

  private async fallbackNoFunctionCalling(groqKey: string, messages: any[]): Promise<any> {
    // Groq doesn't support native function calling — simulate with JSON output
    const lastMsg = messages[messages.length - 1]?.parts?.[0]?.text ?? ''

    const prompt = `You are an AI agent. Given this task, decide which tool to call next or provide a final answer.
Available tools: ${Array.from(this.tools.keys()).join(', ')}

Task: ${lastMsg}

Respond ONLY with JSON: {"action":"tool_name","params":{}} OR {"action":"final_answer","text":"your answer"}`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body:    JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        messages:    [{ role: 'user', content: prompt }],
        max_tokens:  512,
        temperature: 0.1,
      }),
    })

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content ?? '{}'

    try {
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
      if (parsed.action === 'final_answer') {
        return { candidates: [{ content: { parts: [{ text: parsed.text }] } }] }
      }
      return { candidates: [{ content: { parts: [{ functionCall: { name: parsed.action, args: parsed.params } }] } }] }
    } catch {
      return { candidates: [{ content: { parts: [{ text: 'I completed the task but could not format the response.' }] } }] }
    }
  }

  private buildSystemPrompt(): string {
    return `You are WizeMory's AI Agent — a multi-step task executor for a personal knowledge management system.

You have access to tools that can summarise URLs, search the user's knowledge base, create content, and manage items.

RULES:
1. Break complex goals into sequential tool calls
2. Always use saved knowledge context when generating content
3. Be specific and actionable in your final answer
4. If a tool fails, explain what happened and what was accomplished
5. Maximum ${MAX_STEPS} tool calls per run`
  }
}
