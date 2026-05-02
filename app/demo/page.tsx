'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ── Demo data ─────────────────────────────────────────────────────────────────

const ITEMS = [
  { id: '1', type: 'ARTICLE', title: 'The Feynman Technique: Learn Anything Faster', summary: 'Richard Feynman\'s learning method involves teaching concepts in simple language to identify gaps. Studies show this technique improves retention by 40–60% compared to passive reading.', tags: ['learning','productivity','feynman'], keyInsights: ['Teach it simply to expose gaps', 'Identify gaps and return to source', 'Use analogies for complex ideas'], time: '2h ago', url: 'https://example.com/feynman' },
  { id: '2', type: 'YOUTUBE', title: 'How Spaced Repetition Changes the Brain — Andrew Huberman', summary: 'Neuroscientist explains how reviewing at spaced intervals physically changes synaptic strength. Gap effect: reviewing right before forgetting creates 3× stronger memory traces.', tags: ['neuroscience','memory','learning'], keyInsights: ['Space reviews by 1d, 3d, 7d, 21d', 'Emotional salience boosts retention', 'Sleep consolidates reviewed memories'], time: '5h ago', url: '' },
  { id: '3', type: 'NOTE',    title: 'Q2 planning — key decisions and rationale', summary: 'Notes from Q2 planning covering product roadmap, engineering capacity, and go-to-market for enterprise tier.', tags: ['work','planning','strategy'], keyInsights: ['Focus on activation metric first', 'Enterprise needs 3 reference customers', 'Weekly growth target: 15% WoW'], time: '1d ago', url: '' },
  { id: '4', type: 'ARTICLE', title: 'Why Most Second Brains Fail Within 90 Days', summary: 'Research across 2,000 users shows 78% abandon their system within 3 months due to "organisation overhead" — the system requires more effort than it returns.', tags: ['second-brain','productivity','research'], keyInsights: ['Organisation should be automatic', 'Review friction kills habits', 'Daily value is essential'], time: '1d ago', url: 'https://example.com/second-brain' },
  { id: '5', type: 'YOUTUBE', title: 'Naval Ravikant on Reading and Knowledge Compounding', summary: 'Naval explains how reading 1 hour/day compounds into deep domain expertise. Reading without retrieval is like investing without compound interest.', tags: ['reading','investing','knowledge'], keyInsights: ['1hr/day compounds in 7 years', 'Retrieval is the ROI on reading', 'Choose books over tweets'], time: '2d ago', url: '' },
  { id: '6', type: 'ARTICLE', title: 'Building AI Products That Actually Retain Users', summary: 'Products with daily habit loops retain 4× more users than feature-heavy alternatives. The hook: immediate value, daily return trigger.', tags: ['ai','product','retention'], keyInsights: ['Daily value beats feature depth', 'First-use value critical', 'Habit triggers must feel natural'], time: '3d ago', url: 'https://example.com/ai-retention' },
]

const COLLECTIONS = [
  { id: 'c1', name: 'Learning Science', emoji: '🧠', count: 3, color: '#4f63f5', items: [ITEMS[0], ITEMS[1], ITEMS[3]] },
  { id: 'c2', name: 'Product Strategy', emoji: '🚀', count: 2, color: '#1D9E75', items: [ITEMS[2], ITEMS[5]] },
  { id: 'c3', name: 'Reading List',     emoji: '📚', count: 2, color: '#f59e0b', items: [ITEMS[4], ITEMS[0]] },
]

const HIGHLIGHTS = [
  { id: 'h1', text: 'Teach it simply to expose gaps in understanding', note: 'Core of the Feynman Technique', item: ITEMS[0], color: 'yellow' },
  { id: 'h2', text: 'Reading without retrieval is like investing without compound interest', note: 'Naval\'s key insight', item: ITEMS[4], color: 'violet' },
  { id: 'h3', text: 'Organisation overhead is the silent killer of second brain systems', note: 'Why most tools fail', item: ITEMS[3], color: 'blue' },
  { id: 'h4', text: 'Products with daily habit loops retain 4× more users', note: 'Key retention metric', item: ITEMS[5], color: 'green' },
]

const CONNECTIONS = [
  { id: 'cn1', title: 'Spaced repetition ↔ Feynman Technique', description: 'Both leverage the gap effect — optimal forgetting before recall creates stronger memory traces.', items: [ITEMS[0], ITEMS[1]], strength: 0.92 },
  { id: 'cn2', title: 'Second brain failure ↔ AI product retention', description: 'Same root cause — insufficient daily value. When a system costs more effort than it returns, users abandon it.', items: [ITEMS[3], ITEMS[5]], strength: 0.87 },
  { id: 'cn3', title: 'Naval reading ↔ Knowledge compounding', description: 'Reading without a retrieval system is wasted investment. Both argue that consistency compounds into expertise.', items: [ITEMS[4], ITEMS[0]], strength: 0.78 },
]

const REVIEW_ITEMS = [
  { ...ITEMS[0], dueIn: 'Due now',    reviewCount: 3, ease: 'Good' },
  { ...ITEMS[4], dueIn: 'Due now',    reviewCount: 1, ease: 'Hard' },
  { ...ITEMS[1], dueIn: 'Tomorrow',   reviewCount: 2, ease: 'Good' },
  { ...ITEMS[3], dueIn: 'In 3 days',  reviewCount: 4, ease: 'Easy' },
]

const AGENT_EXAMPLES = [
  { label: 'Research → LinkedIn post', icon: '💼', goal: 'Search my knowledge base for insights about learning and productivity, then write a LinkedIn post sharing my top 3 insights' },
  { label: 'Insights → Twitter thread', icon: '𝕏', goal: 'Ask what I know about habit formation and write an 8-tweet thread from my saved research' },
  { label: 'Notes → Study summary', icon: '📚', goal: 'Find everything I\'ve saved about memory and create structured study notes' },
]

const DIGEST_CONTENT = `## Your week in knowledge — 6 items saved

**Top theme this week: Learning Science**
You saved 3 items about memory, retention, and learning techniques. The Huberman video and Feynman article share a core insight: active retrieval before forgetting creates dramatically stronger memory traces than passive re-reading.

**Hidden connection discovered**
The Naval Ravikant video and your Feynman article are both making the same argument: *consistency compounds*. Reading 1 hour/day compounds into expertise. Teaching concepts simply compounds into deep understanding.

**Blind spot alert**
You've been heavily focused on individual learning techniques but haven't saved anything about applying these in a team or teaching context. Consider exploring how to share your knowledge systems with others.

**Your nudge for next week**
You have 2 items due for review. Take 5 minutes before saving anything new — reviewing what you already know is higher leverage than adding more.`

// ── AI mock responses ────────────────────────────────────────────────────────

const AI_RESPONSES: Record<string, string> = {
  default: `Based on your 6 saved items, here's what I found:\n\nYou've been building a strong knowledge base around **learning science and productivity**. The Huberman video and Feynman article share a core insight: active retrieval before forgetting creates 3× stronger memory traces than passive reading.\n\nYour Q2 planning note connects to the AI retention article — both identify that systems fail when maintenance cost exceeds value returned.`,
  learning: `Your saved knowledge on **learning and memory** covers:\n\n1. **Feynman Technique** — teach it simply to expose gaps. The key is not explanation but gap identification.\n\n2. **Spaced repetition** (Huberman) — reviewing at optimal intervals before forgetting changes synaptic strength permanently.\n\n3. **Knowledge compounding** (Naval) — 1 hour/day of reading with active retrieval compounds into expertise over 7 years.\n\nThe thread connecting all three: *active effort at the right time* is what makes knowledge stick.`,
  productivity: `From your saved items on **productivity and systems**:\n\n**Why systems fail:** Research across 2,000 users shows 78% abandon their second brain within 90 days. Root cause: organisation overhead costs more effort than the system returns.\n\n**What works:** Products with daily habit loops retain 4× more users. The hook is immediate value + daily return trigger.\n\n**Your implication:** A system that processes automatically (like WizeMory) removes the overhead that kills most knowledge systems.`,
  patterns: `**Patterns I see across your saved items:**\n\n1. You're drawn to *mechanism-level explanations* — not just "spaced repetition works" but why it changes synaptic strength.\n\n2. You consistently save content that challenges conventional wisdom — the "second brains fail" article, Naval's contrarian reading advice.\n\n3. There's a recurring theme: **consistency over intensity**. Every item argues that small, regular actions compound more than occasional deep efforts.\n\nThis suggests you'd benefit from saving more content about implementation and systems design.`,
}

function getAiResponse(q: string): string {
  const lower = q.toLowerCase()
  if (lower.includes('learn') || lower.includes('memory') || lower.includes('retention')) return AI_RESPONSES.learning
  if (lower.includes('product') || lower.includes('system') || lower.includes('habit')) return AI_RESPONSES.productivity
  if (lower.includes('pattern') || lower.includes('theme') || lower.includes('trend')) return AI_RESPONSES.patterns
  return AI_RESPONSES.default
}

// ── Types ────────────────────────────────────────────────────────────────────

type DemoPlan  = 'FREE' | 'PRO' | 'TEAM'
type DemoView  = 'items' | 'collections' | 'highlights' | 'graph' | 'search' |
                 'review' | 'coach' | 'stats' | 'write' | 'agent' | 'digest'

const PLAN_COLORS: Record<DemoPlan, string> = {
  FREE: '#928c82', PRO: '#4f63f5', TEAM: '#1D9E75',
}

const TYPE_COLORS: Record<string, string> = {
  ARTICLE: 'bg-blue-50 text-blue-700',
  NOTE:    'bg-violet-50 text-violet-700',
  YOUTUBE: 'bg-red-50 text-red-700',
  PDF:     'bg-amber-50 text-amber-700',
}

// ── Sub-view components ───────────────────────────────────────────────────────

function ItemCard({ item }: { item: typeof ITEMS[0] }) {
  return (
    <div className="bg-white border border-ink-100 rounded-2xl p-4 hover:shadow-sm transition-all">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide', TYPE_COLORS[item.type] ?? 'bg-ink-100 text-ink-600')}>{item.type}</span>
      </div>
      <h3 className="font-medium text-sm text-ink-900 leading-snug mb-2 line-clamp-2">{item.title}</h3>
      <p className="text-xs text-ink-500 leading-relaxed line-clamp-2 mb-2">{item.summary}</p>
      <ul className="space-y-1 mb-3">
        {item.keyInsights.slice(0, 2).map((ins, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-ink-500">
            <span className="text-violet-400 shrink-0 mt-0.5">›</span>
            <span className="line-clamp-1">{ins}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-1">
        {item.tags.slice(0, 3).map(t => (
          <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700">{t}</span>
        ))}
      </div>
      <div className="text-[10px] text-ink-300 mt-3 pt-3 border-t border-ink-50">{item.time}</div>
    </div>
  )
}

function UpgradePrompt({ feature, onUpgrade }: { feature: string; onUpgrade: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">✦</div>
        <h2 className="font-display text-2xl text-ink-900 mb-2">{feature} is a Pro feature</h2>
        <p className="text-sm text-ink-500 mb-5 leading-relaxed">Upgrade to Pro to unlock this and all other premium features.</p>
        <button onClick={onUpgrade} className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
          See Pro demo →
        </button>
      </div>
    </div>
  )
}

// ── Graph view ────────────────────────────────────────────────────────────────
function GraphView() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selected, setSelected] = useState<typeof ITEMS[0] | null>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const loadD3 = () => {
      const d3 = (window as any).d3
      if (!d3) return

      const el  = svgRef.current!
      const W   = el.clientWidth  || 560
      const H   = el.clientHeight || 380

      d3.select(el).selectAll('*').remove()

      const nodes: any[] = [
        ...ITEMS.map(i => ({ id: i.id, label: i.title.slice(0, 28) + '…', type: i.type, size: 14, color: i.type === 'YOUTUBE' ? '#ef4444' : i.type === 'NOTE' ? '#7340f5' : '#4f63f5' })),
        { id: 'tag-learning', label: 'learning', type: 'TAG', size: 10, color: '#4f63f5' },
        { id: 'tag-productivity', label: 'productivity', type: 'TAG', size: 9, color: '#4f63f5' },
        { id: 'tag-memory', label: 'memory', type: 'TAG', size: 9, color: '#4f63f5' },
      ]

      const links: any[] = [
        { source: '1', target: 'tag-learning' }, { source: '1', target: 'tag-productivity' },
        { source: '2', target: 'tag-learning' }, { source: '2', target: 'tag-memory' },
        { source: '3', target: 'tag-productivity' },
        { source: '4', target: 'tag-productivity' }, { source: '4', target: 'tag-learning' },
        { source: '5', target: 'tag-learning' },
        { source: '6', target: 'tag-productivity' },
        { source: '1', target: '2', aiLink: true }, { source: '4', target: '6', aiLink: true }, { source: '5', target: '1', aiLink: true },
      ]

      const svg = d3.select(el)
      const g   = svg.append('g')
      svg.call(d3.zoom().scaleExtent([0.3, 3]).on('zoom', (e: any) => g.attr('transform', e.transform)))

      const sim = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(70).strength(0.4))
        .force('charge', d3.forceManyBody().strength(-180))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collision', d3.forceCollide().radius((d: any) => d.size + 6))

      const link = g.append('g').selectAll('line').data(links).join('line')
        .attr('stroke', (d: any) => d.aiLink ? '#4f63f5' : '#e2e8f0')
        .attr('stroke-width', (d: any) => d.aiLink ? 2 : 1)
        .attr('stroke-dasharray', (d: any) => d.aiLink ? '6,3' : '0')
        .attr('stroke-opacity', (d: any) => d.aiLink ? 0.6 : 0.5)

      const node = g.append('g').selectAll('g').data(nodes).join('g')
        .style('cursor', 'pointer')
        .on('click', (_: any, d: any) => {
          const item = ITEMS.find(i => i.id === d.id)
          if (item) setSelected(item)
        })

      node.append('circle')
        .attr('r', (d: any) => d.size)
        .attr('fill', (d: any) => d.color + '20')
        .attr('stroke', (d: any) => d.color)
        .attr('stroke-width', 1.5)

      node.filter((d: any) => d.type !== 'TAG')
        .append('text')
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
        .attr('font-size', 9).attr('fill', (d: any) => d.color).attr('pointer-events', 'none')
        .text((d: any) => d.type === 'YOUTUBE' ? '▶' : d.type === 'NOTE' ? '≡' : '◈')

      node.append('text')
        .attr('text-anchor', 'middle').attr('dy', (d: any) => d.size + 10)
        .attr('font-size', 8.5).attr('fill', '#64748b').attr('pointer-events', 'none')
        .text((d: any) => d.label.slice(0, 18))

      node.on('mouseenter', function(this: any, _: any, d: any) {
        d3.select(this).select('circle').transition().duration(150).attr('r', d.size * 1.3).attr('filter', 'url(#glow)')
      }).on('mouseleave', function(this: any, _: any, d: any) {
        d3.select(this).select('circle').transition().duration(150).attr('r', d.size).attr('filter', null)
      })

      const defs = svg.append('defs')
      const glow = defs.append('filter').attr('id', 'glow')
      glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
      const fm = glow.append('feMerge')
      fm.append('feMergeNode').attr('in', 'blur')
      fm.append('feMergeNode').attr('in', 'SourceGraphic')

      sim.on('tick', () => {
        link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
            .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y)
        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
      })

      node.call(d3.drag()
        .on('start', (e: any, d: any) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on('drag',  (e: any, d: any) => { d.fx = e.x; d.fy = e.y })
        .on('end',   (e: any, d: any) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
      )
    }

    if ((window as any).d3) { loadD3(); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'
    s.onload = loadD3
    document.head.appendChild(s)

    return () => {}
  }, [])

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0a0908]">
      <div className="flex-1 relative">
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/60">{ITEMS.length} nodes · {CONNECTIONS.length} AI connections · Click any node</span>
        </div>
        <div className="absolute bottom-3 right-3 z-10 text-[10px] text-white/30">Drag to move · Scroll to zoom</div>
        <svg ref={svgRef} className="w-full h-full" style={{ minHeight: '380px' }} />
      </div>
      {selected && (
        <div className="w-72 bg-[#0f0d0b] border-l border-white/10 flex flex-col">
          <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs text-white/50 uppercase tracking-wide">{selected.type}</span>
            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white/70 text-sm">✕</button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-sm font-medium text-white/90 leading-snug mb-3">{selected.title}</h3>
            <p className="text-xs text-white/50 leading-relaxed mb-4">{selected.summary}</p>
            <div className="text-[10px] text-white/30 uppercase tracking-wide mb-2">Key insights</div>
            {selected.keyInsights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5 text-xs text-white/60">
                <span className="text-violet-400 shrink-0">›</span>{ins}
              </div>
            ))}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selected.tags.map(t => <span key={t} className="px-2 py-0.5 bg-violet-500/15 text-violet-300 rounded-full text-[10px]">{t}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [plan, setPlan]     = useState<DemoPlan>('PRO')
  const [view, setView]     = useState<DemoView>('items')
  const [chatMsgs, setChatMsgs] = useState([
    { role: 'ai', text: 'I\'ve indexed all 6 of your saved items. Ask me anything — I\'ll answer from your own knowledge base.' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [searchQ, setSearchQ]     = useState('')
  const [writeOutput, setWriteOutput] = useState('')
  const [writeTopic, setWriteTopic]   = useState('')
  const [writeFormat, setWriteFormat] = useState('twitter_thread')
  const [writeLoading, setWriteLoading] = useState(false)
  const [agentGoal, setAgentGoal] = useState('')
  const [agentRun, setAgentRun]   = useState<any>(null)
  const [agentRunning, setAgentRunning] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [reviewDone, setReviewDone]   = useState(false)
  const chatEnd = useRef<HTMLDivElement>(null)

  const isPro  = plan !== 'FREE'
  const isTeam = plan === 'TEAM'

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs])

  // Plan switch resets view if locked
  useEffect(() => {
    const proOnly: DemoView[] = ['graph','review','coach','stats','write','agent','digest']
    if (!isPro && proOnly.includes(view)) setView('items')
  }, [plan]) // eslint-disable-line

  function sendChat() {
    if (!chatInput.trim()) return
    const q = chatInput.trim(); setChatInput(''); setChatLoading(true)
    setChatMsgs(m => [...m, { role: 'user', text: q }])
    setTimeout(() => {
      setChatMsgs(m => [...m, { role: 'ai', text: getAiResponse(q) }])
      setChatLoading(false)
    }, 1400)
  }

  function runAgent() {
    if (!agentGoal.trim()) return
    setAgentRunning(true); setAgentRun(null)
    setTimeout(() => {
      setAgentRun({
        status: 'completed',
        durationMs: 4200,
        steps: [
          { stepNumber: 1, toolName: 'search_knowledge_base', params: { query: agentGoal.slice(0, 40) }, result: { success: true, output: `Found 4 relevant items: "${ITEMS[0].title}", "${ITEMS[1].title}", "${ITEMS[3].title}", "${ITEMS[4].title}"` }, durationMs: 820 },
          { stepNumber: 2, toolName: 'ask_knowledge_base',    params: { question: 'What are the key themes?' }, result: { success: true, output: 'Top themes: spaced repetition, knowledge compounding, habit formation, active retrieval' }, durationMs: 1100 },
          { stepNumber: 3, toolName: writeFormat === 'twitter_thread' ? 'generate_twitter_thread' : 'generate_linkedin_post', params: { topic: agentGoal.slice(0, 60), context: 'spaced repetition, Feynman technique, knowledge compounding' }, result: { success: true, output: `1/ Most people read to remember. But 90% of what you read is forgotten within a week.\n\nHere's what your own research says about fixing that:\n\n2/ The Feynman Technique works because explanation forces retrieval. Teaching it simply exposes exactly what you don't know.\n\n3/ Spaced repetition doesn't just help you remember — it physically changes synaptic strength. The review before forgetting creates 3× stronger traces.\n\n4/ Naval's insight: reading without retrieval is investing without compound interest. The returns don't compound.\n\n5/ The pattern across all of this: consistency + active effort at the right time >> intensity at the wrong time.\n\n6/ Start with 1 item reviewed per day before you save anything new. The ROI compounds.` }, durationMs: 1800 },
        ],
        finalAnswer: `1/ Most people read to remember. But 90% of what you read is forgotten within a week.\n\nHere's what your own research says about fixing that:\n\n2/ The Feynman Technique works because explanation forces retrieval. Teaching it simply exposes exactly what you don't know.\n\n3/ Spaced repetition doesn't just help you remember — it physically changes synaptic strength. The review before forgetting creates 3× stronger traces.\n\n4/ Naval's insight: reading without retrieval is investing without compound interest. The returns don't compound.\n\n5/ The pattern across all of this: consistency + active effort at the right time >> intensity at the wrong time.\n\n6/ Start with 1 item reviewed per day before you save anything new. The ROI compounds.`,
      })
      setAgentRunning(false)
    }, 4200)
  }

  function runWrite() {
    if (!writeTopic.trim()) return
    setWriteLoading(true); setWriteOutput('')
    setTimeout(() => {
      const outputs: Record<string, string> = {
        twitter_thread: `1/ Reading 1 hour/day sounds simple. But without the right system, 90% of what you read disappears within a week.\n\nHere's the system your brain actually needs:\n\n2/ The forgetting curve is real. Without active review, retention drops to 10% within 7 days. This isn't willpower — it's neuroscience.\n\n3/ Spaced repetition changes this. Reviewing right before you forget creates 3× stronger memory traces. The timing is everything.\n\n4/ The Feynman Technique amplifies this further. Teaching a concept simply forces you to identify exactly what you don't understand yet.\n\n5/ Naval's compounding argument: 1 hour/day × 7 years = genuine expertise. But only if you have retrieval. Reading without retrieval is saving without investing.\n\n6/ The system: Save → AI summarises → Review at optimal intervals → Teach it simply. That's the loop. /end`,
        linkedin_post: `Most people treat reading like saving money in a box under the bed.\n\nThe information goes in. But it never compounds.\n\nI spent 3 months studying what actually makes knowledge stick. Here's what the research says:\n\n**The forgetting curve is brutal.** Without active review, you retain less than 10% of what you read within 7 days. This isn't a discipline problem — it's neuroscience.\n\n**Spaced repetition changes the equation.** Reviewing information right before you forget it creates memory traces 3× stronger than re-reading. The timing is everything.\n\n**The Feynman Technique amplifies it.** When you explain a concept simply, you expose exactly what you don't understand. That gap is where real learning happens.\n\nThe system that works: Save → Summarise → Review at optimal intervals → Explain it simply.\n\nSmall, consistent effort compounding daily. That's the difference between reading and knowing.\n\nWhat's your knowledge retention system?\n\n#Learning #Productivity #KnowledgeManagement`,
        blog_post: `# How to Actually Remember What You Read\n\nYou've read hundreds of articles this year. How many can you recall in detail right now?\n\nFor most people, the honest answer is: almost none.\n\nThis isn't laziness. It's the forgetting curve — a neurological reality first mapped by Hermann Ebbinghaus in 1885. Without active reinforcement, memory decays exponentially. Within 7 days, retention drops below 10% for most people.\n\n## What the Research Actually Says\n\nThe neuroscience is clear on three things that actually work:\n\n**1. Spaced repetition changes synaptic strength.** Reviewing information at optimal intervals — right before you forget — creates memory traces 3× stronger than massed review. The timing matters more than the frequency.\n\n**2. Active retrieval beats passive re-reading.** The Feynman Technique works because explaining something simply forces retrieval, not recognition. Recognition is cheap. Retrieval is what builds durable memory.\n\n**3. Consistency compounds.** Naval Ravikant's reading insight applies directly: 1 hour/day with active retrieval compounds into genuine domain expertise over years. Reading without retrieval is the intellectual equivalent of saving money in a box.\n\n## The System\n\nSave. Summarise automatically. Review at optimal intervals. Explain it simply.\n\nThat's the loop. Everything else is complexity.`,
      }
      setWriteOutput(outputs[writeFormat] ?? outputs.twitter_thread)
      setWriteLoading(false)
    }, 2000)
  }

  const searchResults = searchQ.trim()
    ? ITEMS.filter(i => i.title.toLowerCase().includes(searchQ.toLowerCase()) || i.tags.some(t => t.includes(searchQ.toLowerCase())) || i.summary.toLowerCase().includes(searchQ.toLowerCase()))
    : []

  const visibleItems = plan === 'FREE' ? ITEMS.slice(0, 3) : ITEMS

  // ── Nav items ──────────────────────────────────────────────────────────────
  const NAV: Array<{ id: DemoView; label: string; icon: string; proOnly?: boolean }> = [
    { id: 'items',       label: 'All items',      icon: '⊞' },
    { id: 'collections', label: 'Collections',    icon: '❑' },
    { id: 'highlights',  label: 'Highlights',     icon: '✎' },
    { id: 'graph',       label: 'Knowledge graph', icon: '◎', proOnly: true },
    { id: 'review',      label: 'Review queue',   icon: '↻', proOnly: true },
    { id: 'coach',       label: 'AI coach',       icon: '🧠', proOnly: true },
    { id: 'stats',       label: 'My stats',       icon: '📊', proOnly: true },
    { id: 'write',       label: 'AI writer',      icon: '✍️', proOnly: true },
    { id: 'agent',       label: 'AI agent',       icon: '⚡', proOnly: true },
    { id: 'digest',      label: 'Digest',         icon: '◇', proOnly: true },
    { id: 'search',      label: 'Search',         icon: '🔍' },
  ]

  // ── View renderer ─────────────────────────────────────────────────────────
  function renderView() {
    // Locked check
    const proOnly: DemoView[] = ['graph','review','coach','stats','write','agent','digest']
    if (!isPro && proOnly.includes(view)) {
      const labels: Record<string, string> = {
        graph: 'Knowledge Graph', review: 'Spaced Repetition', coach: 'AI Memory Coach',
        stats: 'Lifetime Stats', write: 'AI Writing Assistant', agent: 'AI Agent', digest: 'Weekly Digest',
      }
      return <UpgradePrompt feature={labels[view] ?? view} onUpgrade={() => setPlan('PRO')} />
    }

    switch (view) {
      // ── All items ────────────────────────────────────────────────────────
      case 'items': return (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3 mb-2">
            {[{ l: 'Items saved', v: visibleItems.length }, { l: 'AI connections', v: isPro ? 3 : '—' }, { l: 'Topics', v: isPro ? 8 : '—' }].map(s => (
              <div key={s.l} className="bg-white border border-ink-100 rounded-2xl p-4">
                <div className="text-[10px] text-ink-400 uppercase tracking-wide font-medium mb-1">{s.l}</div>
                <div className="font-display text-3xl text-ink-900">{s.v}</div>
              </div>
            ))}
          </div>
          {isPro && (
            <div>
              <div className="text-[10px] font-medium text-ink-500 uppercase tracking-wide mb-2">AI-found connections</div>
              <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
                {CONNECTIONS.map(c => (
                  <div key={c.id} className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white border border-ink-100 rounded-full text-xs text-ink-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                    {c.title}
                  </div>
                ))}
              </div>
            </div>
          )}
          {plan === 'FREE' && (
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-violet-900">Showing 3 of 6 items</p>
                <p className="text-xs text-violet-600">Upgrade to Pro for unlimited items</p>
              </div>
              <button onClick={() => setPlan('PRO')} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium whitespace-nowrap">See Pro →</button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map(item => <ItemCard key={item.id} item={item} />)}
          </div>
        </div>
      )

      // ── Collections ───────────────────────────────────────────────────────
      case 'collections': return (
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-5">
            <h1 className="font-display text-2xl text-ink-900">Collections</h1>
            <button className="px-3 py-1.5 bg-ink-900 text-white rounded-lg text-xs font-medium">+ New collection</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {COLLECTIONS.map(col => (
              <div key={col.id} className="bg-white border border-ink-100 rounded-2xl p-5 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: col.color + '15' }}>{col.emoji}</div>
                  <div>
                    <div className="font-medium text-sm text-ink-900">{col.name}</div>
                    <div className="text-xs text-ink-400">{col.count} items</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {col.items.slice(0, 2).map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-ink-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-ink-300 shrink-0" />{item.title.slice(0, 38)}…
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="bg-ink-50 border-2 border-dashed border-ink-200 rounded-2xl p-5 flex items-center justify-center cursor-pointer hover:bg-ink-100 transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-2">+</div>
                <div className="text-xs text-ink-400">New collection</div>
              </div>
            </div>
          </div>
        </div>
      )

      // ── Highlights ────────────────────────────────────────────────────────
      case 'highlights': return (
        <div className="flex-1 overflow-y-auto p-5">
          <h1 className="font-display text-2xl text-ink-900 mb-5">Highlights</h1>
          <div className="space-y-4">
            {HIGHLIGHTS.map(h => (
              <div key={h.id} className="bg-white border border-ink-100 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-1 h-full self-stretch rounded-full shrink-0" style={{ background: h.color === 'yellow' ? '#f59e0b' : h.color === 'violet' ? '#7c3aed' : h.color === 'blue' ? '#3b82f6' : '#10b981', minHeight: '40px' }} />
                  <div>
                    <blockquote className="text-sm text-ink-800 font-medium leading-relaxed italic mb-2">"{h.text}"</blockquote>
                    {h.note && <p className="text-xs text-ink-500">{h.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-ink-400 pl-4">
                  <span>From:</span>
                  <span className="font-medium text-ink-600">{h.item.title.slice(0, 45)}…</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

      // ── Knowledge Graph ───────────────────────────────────────────────────
      case 'graph': return <GraphView />

      // ── Review queue ──────────────────────────────────────────────────────
      case 'review': return (
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-display text-2xl text-ink-900">Review queue</h1>
              <p className="text-sm text-ink-400 mt-0.5">{reviewDone ? 'All done for today 🎉' : `${REVIEW_ITEMS.length - reviewIndex} items to review`}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
              <span>🔥</span><span className="text-sm font-medium text-amber-800">7-day streak</span>
            </div>
          </div>
          {reviewDone ? (
            <div className="text-center py-16 bg-white border border-ink-100 rounded-2xl">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="font-display text-xl text-ink-900 mb-2">All caught up!</h2>
              <p className="text-sm text-ink-400">Come back tomorrow for your next review session.</p>
              <button onClick={() => { setReviewIndex(0); setReviewDone(false) }} className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm">Review again</button>
            </div>
          ) : (
            <div className="max-w-lg mx-auto">
              <div className="bg-white border border-ink-100 rounded-2xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-ink-400 font-medium uppercase tracking-wide">Item {reviewIndex + 1} of {REVIEW_ITEMS.length}</span>
                  <span className="text-xs text-ink-400">{REVIEW_ITEMS[reviewIndex]?.dueIn}</span>
                </div>
                <h2 className="font-display text-xl text-ink-900 mb-3">{REVIEW_ITEMS[reviewIndex]?.title}</h2>
                <p className="text-sm text-ink-500 leading-relaxed">{REVIEW_ITEMS[reviewIndex]?.summary}</p>
              </div>
              <div className="bg-white border border-ink-100 rounded-2xl p-5 mb-4">
                <div className="text-xs text-ink-400 uppercase tracking-wide mb-3">Key insights</div>
                {REVIEW_ITEMS[reviewIndex]?.keyInsights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2 text-sm text-ink-700">
                    <span className="text-violet-500 shrink-0">›</span>{ins}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-ink-400 text-center mb-3">How well did you remember this?</p>
                <div className="grid grid-cols-4 gap-2">
                  {['Forgot', 'Hard', 'Good', 'Easy'].map((label, i) => (
                    <button key={label} onClick={() => { if (reviewIndex + 1 >= REVIEW_ITEMS.length) setReviewDone(true); else setReviewIndex(r => r + 1) }}
                      className={cn('py-2.5 rounded-xl text-xs font-medium transition-all',
                        i === 0 ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                        i === 1 ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                        i === 2 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                        'bg-emerald-100 text-emerald-700 hover:bg-emerald-200')}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )

      // ── AI Coach ──────────────────────────────────────────────────────────
      case 'coach': return (
        <div className="flex-1 overflow-y-auto p-5 max-w-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl text-ink-900">AI Memory Coach</h1>
              <p className="text-ink-400 text-sm mt-0.5">Your personalised daily learning brief</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs font-medium text-amber-800">
              🔥 7-day streak
            </div>
          </div>
          <div className="bg-ink-900 text-ink-50 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-sm">🧠</div>
              <span className="text-xs text-ink-400 uppercase tracking-wide">Your daily brief</span>
            </div>
            <p className="text-sm font-medium leading-relaxed">Good morning! You have 2 items due for review and saved 3 new items yesterday. Your knowledge base is growing well.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { icon: '🎯', label: "Today's focus", text: 'Clear your review queue before saving anything new. Reviews compound more than new saves.' },
              { icon: '💡', label: 'Pattern insight', text: "You've been heavily focused on learning science. Try branching into application — how to teach these concepts." },
              { icon: '⚡', label: 'Best action', text: `Review "${ITEMS[0].title.slice(0, 35)}…"` },
              { icon: '🔍', label: 'Knowledge gap', text: 'Consider exploring how these learning techniques apply in collaborative or teaching contexts.' },
            ].map(card => (
              <div key={card.label} className="bg-white border border-ink-100 rounded-xl p-4">
                <div className="text-xl mb-1.5">{card.icon}</div>
                <div className="text-[10px] font-medium text-ink-400 uppercase tracking-wide mb-1">{card.label}</div>
                <p className="text-xs text-ink-600 leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-ink-100 rounded-xl p-4">
            <div className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-3">Your core topics</div>
            <div className="flex flex-wrap gap-2">
              {['learning', 'productivity', 'neuroscience', 'memory', 'knowledge'].map(t => (
                <span key={t} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium border border-violet-100">{t}</span>
              ))}
            </div>
          </div>
        </div>
      )

      // ── Stats ─────────────────────────────────────────────────────────────
      case 'stats': return (
        <div className="flex-1 overflow-y-auto p-5">
          <h1 className="font-display text-2xl text-ink-900 mb-5">My stats</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Items saved',    value: '6',    sub: 'this demo', icon: '⊞' },
              { label: 'Hours saved',    value: '4.2h', sub: 'estimated', icon: '⏱' },
              { label: 'Concepts',       value: '18',   sub: 'retained',  icon: '🧠' },
              { label: 'Current streak', value: '7d',   sub: 'days',      icon: '🔥' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-ink-100 rounded-2xl p-4 text-center">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="font-display text-2xl text-ink-900 mb-0.5">{s.value}</div>
                <div className="text-[10px] text-ink-400 uppercase tracking-wide">{s.label}</div>
                <div className="text-[10px] text-ink-300">{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-ink-100 rounded-2xl p-5 mb-4">
            <div className="text-sm font-medium text-ink-800 mb-4">Items saved by type</div>
            <div className="space-y-3">
              {[{ label: 'Articles', count: 3, pct: 50 }, { label: 'YouTube', count: 2, pct: 33 }, { label: 'Notes', count: 1, pct: 17 }].map(t => (
                <div key={t.label}>
                  <div className="flex justify-between text-xs text-ink-500 mb-1"><span>{t.label}</span><span>{t.count}</span></div>
                  <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${t.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-ink-100 rounded-2xl p-5">
            <div className="text-sm font-medium text-ink-800 mb-3">Top topics</div>
            <div className="flex flex-wrap gap-2">
              {[['learning', 4], ['productivity', 3], ['memory', 2], ['neuroscience', 2], ['knowledge', 2]].map(([t, n]) => (
                <div key={t} className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-50 rounded-full">
                  <span className="text-xs text-ink-700 font-medium">{t}</span>
                  <span className="text-[10px] text-ink-400">{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

      // ── AI Writer ─────────────────────────────────────────────────────────
      case 'write': return (
        <div className="flex-1 overflow-y-auto p-5 max-w-2xl">
          <h1 className="font-display text-2xl text-ink-900 mb-1">AI Writing Assistant</h1>
          <p className="text-ink-400 text-sm mb-5">Generate content using your own saved knowledge as the source.</p>
          <div className="mb-4">
            <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Topic or question</label>
            <input value={writeTopic} onChange={e => setWriteTopic(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runWrite() }}
              placeholder="e.g. What I've learned about building habits, knowledge and memory…"
              className="w-full px-4 py-3 bg-white border border-ink-200 rounded-xl text-sm outline-none focus:border-violet-400 transition-colors" />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ id: 'twitter_thread', label: 'Twitter thread', icon: '𝕏' }, { id: 'linkedin_post', label: 'LinkedIn post', icon: 'in' }, { id: 'blog_post', label: 'Blog post', icon: '✍️' }].map(f => (
                <button key={f.id} onClick={() => setWriteFormat(f.id)}
                  className={cn('p-3 rounded-xl border text-left transition-all', writeFormat === f.id ? 'border-violet-300 bg-violet-50' : 'border-ink-100 bg-white hover:border-ink-200')}>
                  <div className="text-base mb-1">{f.icon}</div>
                  <div className="text-xs font-medium text-ink-900">{f.label}</div>
                </button>
              ))}
            </div>
          </div>
          <button onClick={runWrite} disabled={writeLoading || !writeTopic.trim()}
            className="w-full py-3 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 disabled:opacity-50 transition-all mb-4 flex items-center justify-center gap-2">
            {writeLoading ? <><div className="w-4 h-4 border-2 border-ink-400 border-t-ink-50 rounded-full animate-spin"/>Generating…</> : '✦ Generate from my knowledge'}
          </button>
          {writeOutput && (
            <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-ink-50 flex items-center justify-between">
                <span className="text-xs text-ink-500 font-medium">Generated from your saved knowledge</span>
                <button onClick={() => { navigator.clipboard?.writeText(writeOutput) }} className="px-3 py-1 bg-ink-100 text-ink-700 rounded-lg text-xs hover:bg-ink-200">Copy</button>
              </div>
              <div className="p-5"><pre className="text-sm text-ink-700 whitespace-pre-wrap font-sans leading-relaxed">{writeOutput}</pre></div>
            </div>
          )}
          {!writeOutput && (
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl text-sm text-violet-800 leading-relaxed">
              Try: <button onClick={() => { setWriteTopic('What I\'ve learned about memory and knowledge retention'); setWriteFormat('twitter_thread') }} className="underline hover:text-violet-600">"What I've learned about memory and knowledge retention"</button>
            </div>
          )}
        </div>
      )

      // ── AI Agent ──────────────────────────────────────────────────────────
      case 'agent': return (
        <div className="flex-1 overflow-y-auto p-5 max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl text-ink-900">AI Agent</h1>
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">Pro</span>
          </div>
          <p className="text-ink-400 text-sm mb-5">Describe a multi-step task. The agent breaks it into steps and delivers a complete result.</p>
          <textarea value={agentGoal} onChange={e => setAgentGoal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) runAgent() }}
            rows={3} placeholder="e.g. Search my knowledge base for insights about learning, then write a LinkedIn post from the top 3…"
            className="w-full px-4 py-3 bg-white border border-ink-200 rounded-xl text-sm outline-none focus:border-violet-400 resize-none mb-2" />
          <button onClick={runAgent} disabled={agentRunning || !agentGoal.trim()}
            className="w-full py-3 bg-ink-900 text-ink-50 rounded-xl text-sm font-medium hover:bg-ink-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mb-5">
            {agentRunning ? <><div className="w-4 h-4 border-2 border-ink-400 border-t-ink-50 rounded-full animate-spin"/>Running…</> : <><span>⚡</span>Run agent</>}
          </button>
          {!agentRun && !agentRunning && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {AGENT_EXAMPLES.map(ex => (
                <button key={ex.label} onClick={() => setAgentGoal(ex.goal)}
                  className="text-left p-3.5 bg-white border border-ink-100 rounded-xl hover:border-violet-200 hover:bg-violet-50/30 transition-all">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span>{ex.icon}</span><span className="text-xs font-medium text-ink-700">{ex.label}</span>
                  </div>
                  <p className="text-[10px] text-ink-400 leading-relaxed line-clamp-2">{ex.goal.slice(0, 80)}…</p>
                </button>
              ))}
            </div>
          )}
          {agentRunning && (
            <div className="bg-white border border-ink-100 rounded-2xl p-5">
              <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center"><div className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin"/></div><div><div className="text-sm font-medium text-ink-900">Agent running…</div><div className="text-xs text-ink-400">Searching knowledge base, generating output</div></div></div>
            </div>
          )}
          {agentRun && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"/><span className="text-sm font-medium text-ink-700">Completed · {agentRun.steps.length} steps · {(agentRun.durationMs/1000).toFixed(1)}s</span>
                <button onClick={() => setAgentRun(null)} className="ml-auto text-xs text-ink-400 hover:text-ink-600">Clear</button>
              </div>
              <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-ink-50 text-xs font-medium text-ink-500 uppercase tracking-wide">Execution trace</div>
                {agentRun.steps.map((step: any) => (
                  <div key={step.stepNumber} className="px-4 py-3 border-b border-ink-50 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-ink-100 text-ink-600 text-[10px] font-medium flex items-center justify-center">{step.stepNumber}</span>
                      <span className="text-xs font-medium text-ink-700">{step.toolName.replace(/_/g,' ')}</span>
                      <span className="ml-auto text-[10px] text-emerald-600 font-medium">✓ {step.durationMs}ms</span>
                    </div>
                    <p className="ml-7 text-xs text-ink-500 line-clamp-1">{step.result.output}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-ink-50 flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">Final answer</span>
                  <button onClick={() => navigator.clipboard?.writeText(agentRun.finalAnswer)} className="px-3 py-1 bg-ink-100 text-ink-700 rounded-lg text-xs hover:bg-ink-200">Copy</button>
                </div>
                <div className="p-5"><pre className="text-sm text-ink-700 whitespace-pre-wrap font-sans leading-relaxed">{agentRun.finalAnswer}</pre></div>
              </div>
            </div>
          )}
        </div>
      )

      // ── Digest ────────────────────────────────────────────────────────────
      case 'digest': return (
        <div className="flex-1 overflow-y-auto p-5 max-w-xl">
          <h1 className="font-display text-2xl text-ink-900 mb-1">Weekly Digest</h1>
          <p className="text-ink-400 text-sm mb-5">Your AI-generated weekly learning summary.</p>
          <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-ink-50 flex items-center justify-between">
              <span className="text-sm font-medium text-ink-900">Week of April 28, 2025</span>
              <span className="text-xs text-ink-400">6 items · 🔥 7-day streak</span>
            </div>
            <div className="p-5">
              <div className="prose-wizemory text-ink-700 text-sm leading-relaxed whitespace-pre-line">{DIGEST_CONTENT}</div>
            </div>
          </div>
        </div>
      )

      // ── Search ────────────────────────────────────────────────────────────
      case 'search': return (
        <div className="flex-1 overflow-y-auto p-5">
          <h1 className="font-display text-2xl text-ink-900 mb-4">Search</h1>
          <div className="relative mb-5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">🔍</span>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} autoFocus
              placeholder="Search your knowledge base…"
              className="w-full pl-9 pr-4 py-3 bg-white border border-ink-200 rounded-xl text-sm outline-none focus:border-violet-400" />
          </div>
          {searchQ.trim() === '' ? (
            <div className="text-center py-12 text-ink-400 text-sm">Start typing to search your knowledge base…</div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12 text-ink-400 text-sm">No results for "{searchQ}"</div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-ink-400 font-medium mb-3">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQ}"</div>
              {searchResults.map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          )}
        </div>
      )

      default: return null
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f4f3ef]" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Top banner */}
      <div className="bg-ink-900 text-white px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-widest">Demo mode</span>
          <span className="text-white/20">·</span>
          <span className="text-xs text-white/70">Simulating plan:</span>
          <div className="flex gap-1">
            {(['FREE', 'PRO', 'TEAM'] as DemoPlan[]).map(p => (
              <button key={p} onClick={() => setPlan(p)}
                className={cn('px-3 py-1 rounded-full text-xs font-semibold transition-all',
                  plan === p ? 'text-white' : 'bg-white/10 text-white/50 hover:bg-white/20')}
                style={{ background: plan === p ? PLAN_COLORS[p] : undefined }}>
                {p}
              </button>
            ))}
          </div>
          {isTeam && <span className="text-[10px] text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full">Shared workspace active</span>}
        </div>
        <Link href="/auth/sign-up" className="px-3 py-1.5 bg-violet-500 text-white rounded-lg text-xs font-medium hover:bg-violet-400 transition-colors whitespace-nowrap">
          Start free →
        </Link>
      </div>

      <div className="flex" style={{ height: 'calc(100vh - 44px)' }}>
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-ink-100 flex flex-col shrink-0 overflow-y-auto">
          <div className="px-4 pt-4 pb-3 border-b border-ink-50">
            <div className="font-display text-lg text-ink-900 mb-1">Wize<span className="text-violet-500">Mory</span></div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: PLAN_COLORS[plan] }} />
              <span className="text-[10px] font-medium" style={{ color: PLAN_COLORS[plan] }}>{plan} demo</span>
            </div>
          </div>

          <nav className="px-3 py-2 space-y-0.5 flex-1">
            {NAV.map(n => {
              const locked  = n.proOnly && !isPro
              const active  = view === n.id
              return (
                <button key={n.id}
                  onClick={() => {
                    if (locked) { setPlan('PRO'); setView(n.id) }
                    else setView(n.id)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all text-left',
                    active  ? 'bg-ink-900 text-ink-50 font-medium' :
                    locked  ? 'text-ink-300 hover:text-ink-500 hover:bg-ink-50' :
                    'text-ink-500 hover:text-ink-900 hover:bg-ink-50'
                  )}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm w-5 text-center leading-none">{n.icon}</span>
                    <span className="text-sm">{n.label}</span>
                  </div>
                  {locked && <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-bold shrink-0">PRO</span>}
                </button>
              )
            })}
          </nav>

          <div className="px-3 pb-3 pt-2 border-t border-ink-100 mx-2">
            {plan === 'FREE' ? (
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-violet-900 mb-0.5">Unlock everything</p>
                <p className="text-[10px] text-violet-600 mb-2">Graph, AI, digest, and more</p>
                <button onClick={() => setPlan('PRO')} className="w-full py-2 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700">
                  See Pro demo
                </button>
              </div>
            ) : (
              <Link href="/auth/sign-up" className="block text-center py-2 bg-ink-900 text-ink-50 rounded-lg text-xs font-medium hover:bg-ink-800">
                Sign up free →
              </Link>
            )}
          </div>
        </aside>

        {/* Main + Chat panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main view */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {renderView()}
          </div>

          {/* AI Chat panel — shown on all views except graph/agent/write */}
          {!['graph', 'agent', 'write'].includes(view) && (
            <aside className="w-72 xl:w-80 border-l border-ink-100 bg-white flex flex-col shrink-0">
              <div className="px-4 py-3.5 border-b border-ink-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', isPro ? 'bg-emerald-400 animate-pulse' : 'bg-ink-300')} />
                  <span className="text-sm font-medium text-ink-800">Ask your knowledge base</span>
                </div>
                <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">{plan === 'FREE' ? '3 indexed' : '6 indexed'}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {chatMsgs.map((m, i) => (
                  <div key={i} className={cn('rounded-xl px-3.5 py-2.5 text-xs leading-relaxed',
                    m.role === 'user' ? 'bg-violet-50 text-violet-900 ml-6' : 'bg-ink-50 text-ink-700')}>
                    {m.text}
                  </div>
                ))}
                {chatLoading && (
                  <div className="bg-ink-50 rounded-xl px-3.5 py-2.5">
                    <div className="flex gap-1 items-center h-4">
                      {[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: `${j*0.15}s` }}/>)}
                    </div>
                  </div>
                )}
                {!isPro && chatMsgs.length === 1 && (
                  <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
                    <p className="text-xs font-medium text-violet-900 mb-1">AI Q&A requires Pro</p>
                    <button onClick={() => setPlan('PRO')} className="text-xs text-violet-600 underline">See Pro demo</button>
                  </div>
                )}
                {isPro && chatMsgs.length === 1 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] text-ink-400 px-1">Try asking:</p>
                    {['What have I saved about learning?', 'What patterns do you see?', 'What should I review next?'].map(s => (
                      <button key={s} onClick={() => { setChatInput(s); setTimeout(() => { setChatInput(''); setChatLoading(true); setTimeout(() => { setChatMsgs(m => [...m, { role: 'user', text: s }, { role: 'ai', text: getAiResponse(s) }]); setChatLoading(false) }, 1400) }, 50) }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-ink-600 bg-ink-50 hover:bg-ink-100 border border-ink-100 transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={chatEnd} />
              </div>

              <div className="p-3.5 border-t border-ink-100">
                {!isPro ? (
                  <button onClick={() => setPlan('PRO')} className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-xs font-medium hover:bg-violet-700">
                    Upgrade to Pro for unlimited AI →
                  </button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') sendChat() }}
                      placeholder="Ask anything about your notes…"
                      className="flex-1 text-xs px-3 py-2.5 bg-ink-50 border border-ink-100 rounded-xl outline-none focus:border-ink-300 text-ink-800 placeholder-ink-400" />
                    <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading}
                      className="w-8 h-8 rounded-xl bg-violet-500 text-white flex items-center justify-center hover:bg-violet-600 disabled:opacity-40 text-sm shrink-0">
                      →
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-ink-300 mt-2 text-center">Demo — <Link href="/auth/sign-up" className="text-violet-500 hover:underline">sign up free</Link></p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
