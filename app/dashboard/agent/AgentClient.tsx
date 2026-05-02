'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface AgentStep {
  stepNumber: number; toolName: string; params: Record<string, any>
  result: { success: boolean; output: string; error?: string }; durationMs: number
}
interface AgentRun {
  id: string; status: string; steps: AgentStep[]
  finalAnswer: string; durationMs: number; goal: string
}

const EXAMPLES = [
  { label: 'Research → LinkedIn post', icon: '📝', goal: 'Search my knowledge base for everything about productivity and learning, then write a LinkedIn post sharing my top 3 insights', estimate: '~2 steps · 20s' },
  { label: 'Summarise → Study notes', icon: '📚', goal: 'Search my knowledge base for everything about AI and the future, then create comprehensive study notes I can review later', estimate: '~2 steps · 15s' },
  { label: 'Insights → Twitter thread', icon: '𝕏', goal: 'Ask my knowledge base what I know about building good habits, then write an 8-tweet thread sharing the top insights', estimate: '~2 steps · 20s' },
  { label: 'Research → Email draft', icon: '✉️', goal: 'Search my saved items for everything about pricing strategy and draft a professional email summarising the key findings', estimate: '~2 steps · 20s' },
]

const TOOL_ICONS: Record<string, string> = {
  summarise_url: '🔗', save_to_knowledge_base: '💾',
  search_knowledge_base: '🔍', ask_knowledge_base: '🧠',
  generate_linkedin_post: '💼', generate_twitter_thread: '𝕏',
  draft_email: '✉️', create_study_summary: '📚',
}

export default function AgentClient() {
  const [goal, setGoal]   = useState('')
  const [run, setRun]     = useState<AgentRun | null>(null)
  const [running, setRunning] = useState(false)
  const [copied, setCopied]   = useState(false)

  async function execute() {
    if (!goal.trim()) return toast.error('Describe what you want the agent to do')
    setRunning(true); setRun(null)
    try {
      const res  = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: goal.trim() }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Agent run failed')
      setRun(data)
      toast.success(`Completed in ${(data.durationMs / 1000).toFixed(1)}s · ${data.steps.length} steps`)
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong')
    } finally { setRunning(false) }
  }

  async function copyResult() {
    if (!run?.finalAnswer) return
    await navigator.clipboard.writeText(run.finalAnswer)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast.success('Copied!')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-display text-3xl text-ink-900">AI Agent</h1>
          <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">Pro</span>
        </div>
        <p className="text-ink-400 text-sm">Describe a multi-step task. The agent breaks it into steps, uses your knowledge base, and delivers a complete result.</p>
      </div>

      <div className="mb-4">
        <textarea value={goal} onChange={e => setGoal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) execute() }}
          rows={4} placeholder="e.g. Search my saved items about productivity, find the key themes, and write a LinkedIn post…"
          className="w-full px-4 py-3 bg-white border border-ink-200 rounded-xl text-sm text-ink-800 outline-none focus:border-violet-400 transition-colors resize-none leading-relaxed" />
        <p className="text-xs text-ink-400 mt-1.5">⌘+Enter to run</p>
      </div>

      <button onClick={execute} disabled={running || !goal.trim()}
        className="w-full py-3.5 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mb-8">
        {running ? (<><div className="w-4 h-4 border-2 border-ink-400 border-t-ink-50 rounded-full animate-spin"/>Running…</>) : (<><span>⚡</span>Run agent</>)}
      </button>

      {!run && !running && (
        <div>
          <div className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-3">Example workflows</div>
          <div className="grid grid-cols-2 gap-3">
            {EXAMPLES.map(w => (
              <button key={w.label} onClick={() => setGoal(w.goal)}
                className="text-left p-4 bg-white border border-ink-100 rounded-2xl hover:border-violet-200 hover:bg-violet-50/30 transition-all group">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{w.icon}</span>
                  <span className="text-xs font-medium text-ink-700 group-hover:text-violet-700">{w.label}</span>
                </div>
                <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">{w.goal.slice(0, 90)}…</p>
                <div className="text-[10px] text-ink-300 mt-2">{w.estimate}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {running && (
        <div className="bg-white border border-ink-100 rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin"/>
            </div>
            <div>
              <div className="text-sm font-medium text-ink-900">Agent is working…</div>
              <div className="text-xs text-ink-400">Breaking goal into steps, calling tools, building your result</div>
            </div>
          </div>
        </div>
      )}

      {run && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('w-2.5 h-2.5 rounded-full', run.status === 'completed' ? 'bg-emerald-400' : 'bg-red-400')}/>
              <span className="text-sm font-medium text-ink-700">
                {run.status === 'completed' ? 'Completed' : 'Failed'} · {run.steps.length} steps · {(run.durationMs / 1000).toFixed(1)}s
              </span>
            </div>
            <button onClick={() => setRun(null)} className="text-xs text-ink-400 hover:text-ink-600">Clear</button>
          </div>

          {run.steps.length > 0 && (
            <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-ink-50 text-xs font-medium text-ink-500 uppercase tracking-wide">Execution trace</div>
              <div className="divide-y divide-ink-50">
                {run.steps.map(step => (
                  <div key={step.stepNumber} className="px-4 py-3">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="w-5 h-5 rounded-full bg-ink-100 text-ink-600 text-[10px] font-medium flex items-center justify-center shrink-0">{step.stepNumber}</span>
                      <span>{TOOL_ICONS[step.toolName] ?? '🔧'}</span>
                      <span className="text-xs font-medium text-ink-700">{step.toolName.replace(/_/g, ' ')}</span>
                      <span className={cn('ml-auto text-[10px] font-medium', step.result.success ? 'text-emerald-600' : 'text-red-500')}>
                        {step.result.success ? '✓' : '✗'} {step.durationMs}ms
                      </span>
                    </div>
                    {step.result.success && step.result.output && (
                      <div className="ml-8 text-xs text-ink-500 mt-1 leading-relaxed line-clamp-2">{step.result.output}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {run.finalAnswer && (
            <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-ink-50 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">Final answer</span>
                <button onClick={copyResult} className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all', copied ? 'bg-emerald-500 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200')}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="px-4 py-4">
                <pre className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed font-sans">{run.finalAnswer}</pre>
              </div>
            </div>
          )}

          <button onClick={execute} className="w-full py-3 border border-ink-200 text-ink-600 rounded-xl text-sm hover:bg-ink-50 transition-colors">
            Run again
          </button>
        </div>
      )}
    </div>
  )
}
