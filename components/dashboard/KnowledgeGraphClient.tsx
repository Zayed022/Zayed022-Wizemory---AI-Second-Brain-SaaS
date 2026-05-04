'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ── Type definitions ─────────────────────────────────────────────────────────
interface GraphNode {
  id: string; label: string; fullTitle: string; type: string
  tags: string[]; summary: string; keyInsights: string[]
  size: number; color: string; clusterColor?: string
  cluster?: string; isTag?: boolean; createdAt?: string
  x?: number; y?: number; vx?: number; vy?: number; fx?: number | null; fy?: number | null
}
interface GraphEdge {
  source: string | GraphNode; target: string | GraphNode
  type: string; label?: string; weight?: number; description?: string
}
interface GraphCluster { id: string; label: string; color: string; count: number }
interface GraphData {
  nodes: GraphNode[]; edges: GraphEdge[]
  clusters: GraphCluster[]
  stats: { totalNodes: number; totalEdges: number; totalItems: number; totalTopics: number; aiConnections: number }
}
interface SelectedNode extends GraphNode { relatedNodes?: GraphNode[] }

// ── Constants ────────────────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, string> = {
  ARTICLE: '◈', NOTE: '≡', YOUTUBE: '▶', VOICE: '◎', PDF: '▤', BOOKMARK: '◇', TAG: '⬡', PODCAST: '♪',
}
const TYPE_LABELS: Record<string, string> = {
  ARTICLE: 'Article', NOTE: 'Note', YOUTUBE: 'YouTube', VOICE: 'Voice',
  PDF: 'PDF', BOOKMARK: 'Bookmark', TAG: 'Topic', PODCAST: 'Podcast',
}

// ── Empty states ─────────────────────────────────────────────────────────────
function EmptyState({ itemCount }: { itemCount: number }) {
  if (itemCount === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d0b09]">
        <div className="text-center max-w-sm px-6">
          <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-3xl mx-auto mb-6">◈</div>
          <h2 className="text-white text-xl font-medium mb-3">Your knowledge graph awaits</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-6">Save your first article, note, or YouTube video. Memora's AI will build connections between everything you save — automatically.</p>
          <Link href="/dashboard/add" className="inline-block px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-500 transition-colors">
            Save your first item →
          </Link>
        </div>
      </div>
    )
  }
  if (itemCount < 3) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d0b09]">
        <div className="text-center max-w-sm px-6">
          <div className="relative w-24 h-24 mx-auto mb-6">
            {[0,1,2].map(i => (
              <div key={i} className="absolute rounded-full border border-violet-500/30"
                style={{ inset: `${i*10}px`, animation: `pulse ${1.5 + i*0.3}s ease-in-out infinite`, animationDelay: `${i*0.2}s` }} />
            ))}
            <div className="absolute inset-0 flex items-center justify-center text-2xl text-violet-400">{itemCount}</div>
          </div>
          <h2 className="text-white text-xl font-medium mb-3">Graph forming…</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-2">You have <span className="text-violet-400 font-medium">{itemCount} item{itemCount > 1 ? 's' : ''}</span> saved.</p>
          <p className="text-white/30 text-sm mb-6">Save {3 - itemCount} more to start seeing connections. The graph becomes richer with every save.</p>
          <Link href="/dashboard/add" className="inline-block px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-500 transition-colors">
            Add {3 - itemCount} more →
          </Link>
        </div>
      </div>
    )
  }
  return null
}

// ── Main component ───────────────────────────────────────────────────────────
export default function KnowledgeGraphClient({ itemCount, plan }: { itemCount: number; plan: string }) {
  const svgRef            = useRef<SVGSVGElement>(null)
  const simulationRef     = useRef<any>(null)
  const [data, setData]   = useState<GraphData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<SelectedNode | null>(null)
  const [filter, setFilter]     = useState('all')
  const [aiExplain, setAiExplain] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null)
  const [zoom, setZoom]         = useState(1)
  const [showClusters, setShowClusters] = useState(true)
  const zoomRef = useRef<any>(null)

  // Fetch graph data
  useEffect(() => {
    fetch('/api/graph')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Redraw when data or filter changes
  useEffect(() => {
    if (!data || !svgRef.current || itemCount < 3) return
    drawGraph()
  }, [data, filter, showClusters]) // eslint-disable-line

  // Ask AI about a node
  async function askAiAboutNode(node: GraphNode) {
    setAiLoading(true); setAiExplain('')
    try {
      const res = await fetch('/api/agent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          goal: `I have a saved item titled "${node.fullTitle}". ${node.summary ? `Summary: ${node.summary}` : ''} Tags: ${node.tags.join(', ')}. What is the most important insight I should take away from this, and how does it connect to broader themes in learning or knowledge management? Answer in 2-3 sentences.`
        }),
      })
      const d = await res.json()
      setAiExplain(d.finalAnswer ?? d.steps?.[d.steps.length-1]?.result?.output ?? 'No insight available.')
    } catch {
      setAiExplain('AI is temporarily unavailable. Try again in a moment.')
    }
    setAiLoading(false)
  }

  // Explain connection between two nodes
  async function explainConnection(nodeId: string) {
    if (!data || !selected) return
    const other = data.nodes.find(n => n.id === nodeId)
    if (!other) return
    setAiLoading(true); setAiExplain('')
    try {
      const sharedTags = selected.tags.filter(t => other.tags.includes(t))
      const res = await fetch('/api/graph', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          type:        'explain_connection',
          nodeATitle:  selected.fullTitle,
          nodeBTitle:  other.fullTitle,
          sharedTag:   sharedTags[0] ?? selected.tags[0],
        }),
      })
      const d = await res.json()
      setAiExplain(`Connection with "${other.label}": ${d.explanation}`)
    } catch {
      setAiExplain('Could not explain this connection right now.')
    }
    setAiLoading(false)
  }

  // Zoom controls
  function handleZoom(direction: 'in' | 'out' | 'reset') {
    const d3 = (window as any).d3
    if (!d3 || !svgRef.current || !zoomRef.current) return
    const svg = d3.select(svgRef.current)
    if (direction === 'in')    svg.transition().duration(300).call(zoomRef.current.scaleBy, 1.4)
    if (direction === 'out')   svg.transition().duration(300).call(zoomRef.current.scaleBy, 0.7)
    if (direction === 'reset') svg.transition().duration(400).call(zoomRef.current.transform, d3.zoomIdentity)
  }

  function drawGraph() {
    const d3 = (window as any).d3
    if (!d3 || !data || !svgRef.current) return

    const el = svgRef.current
    d3.select(el).selectAll('*').remove()

    const W = el.clientWidth  || 900
    const H = el.clientHeight || 600

    // Filter nodes
    const filteredNodes: GraphNode[] = filter === 'all'
      ? data.nodes
      : data.nodes.filter(n => n.type === filter || (filter === 'TAG' && n.isTag))

    const nodeIds = new Set(filteredNodes.map(n => n.id))
    const filteredEdges = data.edges.filter(e => {
      const s = typeof e.source === 'string' ? e.source : (e.source as GraphNode).id
      const t = typeof e.target === 'string' ? e.target : (e.target as GraphNode).id
      return nodeIds.has(s) && nodeIds.has(t)
    })

    const nodes: GraphNode[] = filteredNodes.map(n => ({ ...n }))
    const edges = filteredEdges.map(e => ({ ...e }))

    // ── SVG setup ─────────────────────────────────────────────────────────
    const svg = d3.select(el).attr('width', W).attr('height', H)

    // Defs: glow filters + arrow marker + animated dash
    const defs = svg.append('defs')

    // Glow filter for selected/hovered nodes
    const glow = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
    glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur')
    const feMerge = glow.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Stronger glow
    const glowStrong = defs.append('filter').attr('id', 'glow-strong').attr('x', '-80%').attr('y', '-80%').attr('width', '260%').attr('height', '260%')
    glowStrong.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'coloredBlur')
    const fm2 = glowStrong.append('feMerge')
    fm2.append('feMergeNode').attr('in', 'coloredBlur')
    fm2.append('feMergeNode').attr('in', 'SourceGraphic')

    // Arrow marker for AI connections
    defs.append('marker').attr('id', 'arrow-ai').attr('viewBox', '0 0 10 10')
      .attr('refX', 8).attr('refY', 5).attr('markerWidth', 5).attr('markerHeight', 5).attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M2 2L8 5L2 8').attr('fill', 'none').attr('stroke', '#7340f5').attr('stroke-width', '1.5').attr('stroke-linecap', 'round')

    // Background
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#0a0908')

    // ── Zoom & pan ────────────────────────────────────────────────────────
    const g = svg.append('g')
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.15, 6])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform)
        setZoom(Math.round(event.transform.k * 100) / 100)
      })

    zoomRef.current = zoomBehavior
    svg.call(zoomBehavior)
    svg.on('dblclick.zoom', null) // Disable double-click zoom

    // ── Cluster background halos ──────────────────────────────────────────
    const clusterGroup = g.append('g').attr('class', 'clusters')

    // ── Force simulation ──────────────────────────────────────────────────
    // Performance: use Barnes-Hut approximation (theta = 0.9) for 100+ nodes
    const sim = d3.forceSimulation(nodes)
      .force('link',
        d3.forceLink(edges)
          .id((d: any) => d.id)
          .distance((d: any) => {
            if (d.type === 'connection') return 120
            if (d.type === 'tag') return 70
            return 90
          })
          .strength((d: any) => d.type === 'connection' ? 0.8 : 0.4)
      )
      .force('charge',
        d3.forceManyBody()
          .strength((d: any) => d.isTag ? -120 : -250)
          .theta(0.9)  // Barnes-Hut: faster for 100+ nodes
          .distanceMax(350)
      )
      .force('center', d3.forceCenter(W / 2, H / 2).strength(0.05))
      .force('collision',
        d3.forceCollide()
          .radius((d: any) => d.size + 8)
          .strength(0.9)
          .iterations(2)
      )
      // Weak cluster attraction: nodes in the same cluster pull toward each other
      .force('cluster', (alpha: number) => {
        if (!showClusters) return
        const clusterCenters = new Map<string, { x: number; y: number; count: number }>()
        nodes.forEach((d: any) => {
          if (!d.cluster) return
          const c = clusterCenters.get(d.cluster) ?? { x: 0, y: 0, count: 0 }
          c.x += d.x ?? 0; c.y += d.y ?? 0; c.count++
          clusterCenters.set(d.cluster, c)
        })
        clusterCenters.forEach((c, _k) => { if (c.count) { c.x /= c.count; c.y /= c.count } })
        nodes.forEach((d: any) => {
          if (!d.cluster) return
          const c = clusterCenters.get(d.cluster); if (!c) return
          d.vx = (d.vx ?? 0) + (c.x - (d.x ?? 0)) * alpha * 0.08
          d.vy = (d.vy ?? 0) + (c.y - (d.y ?? 0)) * alpha * 0.08
        })
      })
      .alphaDecay(0.02)     // Slower cooling = smoother settle
      .velocityDecay(0.35)  // Damping

    simulationRef.current = sim

    // ── Edges ─────────────────────────────────────────────────────────────
    const edgeGroup = g.append('g').attr('class', 'edges')

    // Tag edges (dashed, dim)
    const tagEdgesSel = edgeGroup.selectAll('line.tag-edge')
      .data(edges.filter((e: any) => e.type === 'tag'))
      .join('line')
      .attr('class', 'tag-edge')
      .attr('stroke', '#ffffff12')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,5')

    // AI connection edges (solid, animated, glowing)
    const aiEdgesSel = edgeGroup.selectAll('line.ai-edge')
      .data(edges.filter((e: any) => e.type === 'connection'))
      .join('line')
      .attr('class', 'ai-edge')
      .attr('stroke', '#7340f5')
      .attr('stroke-width', (d: any) => 1 + (d.weight ?? 0.5) * 2)
      .attr('stroke-opacity', (d: any) => 0.4 + (d.weight ?? 0.5) * 0.4)
      .attr('stroke-dasharray', '8,4')
      .attr('marker-end', 'url(#arrow-ai)')
      .style('animation', 'dash-flow 3s linear infinite')

    // Animated dash CSS (injected once)
    if (!document.getElementById('graph-keyframes')) {
      const style = document.createElement('style')
      style.id = 'graph-keyframes'
      style.textContent = `
        @keyframes dash-flow { to { stroke-dashoffset: -24; } }
        @keyframes pulse-ring { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:.2;transform:scale(1.4)} }
        @keyframes node-appear { from{opacity:0;transform:scale(0.3)} to{opacity:1;transform:scale(1)} }
      `
      document.head.appendChild(style)
    }

    // Edge labels (AI connections only, visible on zoom ≥ 1.5)
    const edgeLabelsSel = edgeGroup.selectAll('text.edge-label')
      .data(edges.filter((e: any) => e.type === 'connection' && e.label))
      .join('text')
      .attr('class', 'edge-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', '#7340f540')
      .attr('pointer-events', 'none')
      .text((d: any) => (d.label ?? '').slice(0, 28))

    // ── Nodes ─────────────────────────────────────────────────────────────
    const nodeGroup = g.append('g').attr('class', 'nodes')

    const nodesSel = nodeGroup.selectAll('g.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .style('animation', 'node-appear 0.4s ease-out')

    // Outer pulse ring (for non-tag nodes)
    nodesSel.filter((d: any) => !d.isTag)
      .append('circle')
      .attr('class', 'pulse-ring')
      .attr('r', (d: any) => d.size + 6)
      .attr('fill', 'none')
      .attr('stroke', (d: any) => d.color)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.2)
      .style('pointer-events', 'none')

    // Main circle fill (slightly transparent)
    nodesSel.append('circle')
      .attr('class', 'node-fill')
      .attr('r', (d: any) => d.size)
      .attr('fill', (d: any) => d.color + (d.isTag ? '18' : '22'))
      .attr('stroke', (d: any) => d.color)
      .attr('stroke-width', (d: any) => d.isTag ? 1 : 1.8)
      .attr('stroke-opacity', 0.85)

    // Type icon inside node
    nodesSel.filter((d: any) => !d.isTag && (d as any).size > 12)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', (d: any) => Math.max(8, d.size * 0.55))
      .attr('fill', (d: any) => d.color)
      .attr('opacity', 0.8)
      .attr('pointer-events', 'none')
      .text((d: any) => TYPE_ICONS[d.type] ?? '·')

    // Label below node
    nodesSel.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'hanging')
      .attr('dy', (d: any) => d.size + 5)
      .attr('font-size', (d: any) => d.isTag ? 9.5 : 10)
      .attr('font-weight', (d: any) => d.isTag ? '500' : '400')
      .attr('fill', (d: any) => d.isTag ? '#a78bfa' : '#ffffffaa')
      .attr('pointer-events', 'none')
      .text((d: any) => d.label)

    // ── Hover interactions ─────────────────────────────────────────────────
    nodesSel
    .on('mouseenter', function(this: SVGGElement, event: any, d: any) {
        // Glow the hovered node
        d3.select(this).select('.node-fill')
          .transition().duration(150)
          .attr('r', d.size * 1.25)
          .attr('filter', 'url(#glow)')
          .attr('stroke-opacity', 1)
          .attr('fill-opacity', 0.45)

        d3.select(this).select('.pulse-ring')
          .transition().duration(150)
          .attr('opacity', 0.5)
          .attr('r', d.size + 10)

        // Highlight connected edges
        const dId = d.id
        tagEdgesSel
          .transition().duration(100)
          .attr('stroke', (e: any) => {
            const s = typeof e.source === 'string' ? e.source : e.source.id
            const t = typeof e.target === 'string' ? e.target : e.target.id
            return (s === dId || t === dId) ? '#ffffff50' : '#ffffff08'
          })
          .attr('stroke-width', (e: any) => {
            const s = typeof e.source === 'string' ? e.source : e.source.id
            const t = typeof e.target === 'string' ? e.target : e.target.id
            return (s === dId || t === dId) ? 1.5 : 0.5
          })

        aiEdgesSel
          .transition().duration(100)
          .attr('stroke-opacity', (e: any) => {
            const s = typeof e.source === 'string' ? e.source : e.source.id
            const t = typeof e.target === 'string' ? e.target : e.target.id
            return (s === dId || t === dId) ? 0.9 : 0.15
          })
          .attr('stroke-width', (e: any) => {
            const s = typeof e.source === 'string' ? e.source : e.source.id
            const t = typeof e.target === 'string' ? e.target : e.target.id
            return (s === dId || t === dId) ? 2.5 : 1
          })

        // Highlight connected nodes
        nodesSel
          .transition().duration(100)
          .attr('opacity', (n: any) => {
            if (n.id === dId) return 1
            const connected = edges.some((e: any) => {
              const s = typeof e.source === 'string' ? e.source : e.source.id
              const t = typeof e.target === 'string' ? e.target : e.target.id
              return (s === dId && t === n.id) || (t === dId && s === n.id)
            })
            return connected ? 1 : 0.25
          })
      })
      .on('mouseenter', function(this: SVGGElement, event: any, d: any) {
        d3.select(this).select('.node-fill')
          .transition().duration(200)
          .attr('r', d.size)
          .attr('filter', null)
          .attr('stroke-opacity', 0.85)
          .attr('fill-opacity', 1)

        d3.select(this).select('.pulse-ring')
          .transition().duration(200)
          .attr('opacity', 0.2)
          .attr('r', d.size + 6)

        tagEdgesSel.transition().duration(200).attr('stroke', '#ffffff12').attr('stroke-width', 1)
        aiEdgesSel.transition().duration(200)
          .attr('stroke-opacity', (e: any) => 0.4 + (e.weight ?? 0.5) * 0.4)
          .attr('stroke-width', (e: any) => 1 + (e.weight ?? 0.5) * 2)
        nodesSel.transition().duration(200).attr('opacity', 1)
      })

    // ── Click to select ────────────────────────────────────────────────────
    nodesSel.on('click', (event: any, d: any) => {
      event.stopPropagation()

      // Find related nodes (connected by any edge)
      const dId = d.id
      const relatedIds = new Set<string>()
      edges.forEach((e: any) => {
        const s = typeof e.source === 'string' ? e.source : e.source.id
        const t = typeof e.target === 'string' ? e.target : e.target.id
        if (s === dId) relatedIds.add(t)
        if (t === dId) relatedIds.add(s)
      })
      const relatedNodes = nodes.filter(n => relatedIds.has(n.id)).slice(0, 8)

      setSelected({ ...d, relatedNodes })
      setAiExplain('')
      setAiLoading(false)

      // Glow selected node strongly
      nodesSel.select('.node-fill')
        .transition().duration(200)
        .attr('filter', (n: any) => n.id === dId ? 'url(#glow-strong)' : null)
    })

    // Click background to deselect
    svg.on('click', () => { setSelected(null); setAiExplain('') })

    // ── Drag ──────────────────────────────────────────────────────────────
    nodesSel.call(
      d3.drag()
        .on('start', (event: any, d: any) => {
          event.sourceEvent.stopPropagation()
          if (!event.active) sim.alphaTarget(0.2).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (event: any, d: any) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event: any, d: any) => {
          if (!event.active) sim.alphaTarget(0)
          d.fx = null; d.fy = null
        })
    )

    // ── Tick (throttled for performance) ──────────────────────────────────
    let tickCount = 0
    sim.on('tick', () => {
      tickCount++
      // Only update DOM every 2 ticks for 100+ nodes (halves render work)
      if (nodes.length > 80 && tickCount % 2 !== 0) return

      tagEdgesSel
        .attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y)

      aiEdgesSel
        .attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y)

      edgeLabelsSel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2)

      nodesSel.attr('transform', (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`)

      // Draw cluster halos after first 30 ticks (nodes have moved)
      if (tickCount === 30 && showClusters) drawClusterHalos(clusterGroup, nodes, data.clusters, d3)
    })

    // Stop simulation after settled to save CPU
    sim.on('end', () => {
      if (showClusters) drawClusterHalos(clusterGroup, nodes, data.clusters, d3)
    })
  }

  function loadD3ThenDraw() {
    if ((window as any).d3) { drawGraph(); return }
    const existing = document.getElementById('d3-graph-script')
    if (existing) { existing.addEventListener('load', drawGraph); return }
    const script = document.createElement('script')
    script.id = 'd3-graph-script'
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'
    script.onload = drawGraph
    document.head.appendChild(script)
  }

  useEffect(() => {
    if (!data || !svgRef.current || itemCount < 3) return
    loadD3ThenDraw()
    return () => { simulationRef.current?.stop() }
  }, [data, filter, showClusters]) // eslint-disable-line

  if (itemCount < 3) {
    return (
      <div className="flex flex-col h-full bg-[#0a0908]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h1 className="text-white font-medium text-sm">Knowledge graph</h1>
        </div>
        <EmptyState itemCount={itemCount} />
      </div>
    )
  }

  return (
    <div className="flex h-full bg-[#0a0908] overflow-hidden">
      {/* ── Graph canvas ──────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-white text-sm font-medium leading-none">Knowledge graph</h1>
              {data && (
                <p className="text-white/30 text-xs mt-0.5">
                  {data.stats.totalNodes} nodes · {data.stats.totalEdges} connections · {data.stats.aiConnections} AI links
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Cluster toggle */}
            <button
              onClick={() => setShowClusters(!showClusters)}
              className={cn('px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                showClusters ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-white/5 border-white/10 text-white/40'
              )}>
              ⬡ Clusters
            </button>

            {/* Type filters */}
            {['all','ARTICLE','NOTE','YOUTUBE','TAG'].map(f => (
              <button key={f}
                onClick={() => setFilter(f)}
                className={cn('px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  filter === f ? 'bg-white text-gray-900' : 'bg-white/8 text-white/50 hover:bg-white/15 hover:text-white/80')}>
                {f === 'all' ? 'All' : TYPE_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border border-violet-500/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-violet-500/50 animate-ping" style={{ animationDelay: '0.3s' }} />
                <div className="absolute inset-4 rounded-full bg-violet-500/20 border border-violet-500" />
              </div>
              <p className="text-white/40 text-sm">Building your knowledge graph…</p>
            </div>
          ) : (
            <svg ref={svgRef} className="w-full h-full block" />
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
            {[
              { label: '+', action: () => handleZoom('in'), title: 'Zoom in' },
              { label: '−', action: () => handleZoom('out'), title: 'Zoom out' },
              { label: '⌂', action: () => handleZoom('reset'), title: 'Reset view' },
            ].map(b => (
              <button key={b.label} onClick={b.action} title={b.title}
                className="w-8 h-8 bg-white/8 hover:bg-white/15 border border-white/15 rounded-lg text-white/60 hover:text-white text-sm font-medium transition-all flex items-center justify-center backdrop-blur-sm">
                {b.label}
              </button>
            ))}
            <div className="text-center text-white/25 text-[9px] mt-0.5">{Math.round(zoom * 100)}%</div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm border border-white/8 rounded-xl p-3 space-y-1.5">
            {[
              { color: '#3b82f6', label: 'Article' },
              { color: '#7340f5', label: 'Note' },
              { color: '#ef4444', label: 'YouTube' },
              { color: '#f59e0b', label: 'Voice' },
              { color: '#ec4899', label: 'PDF' },
              { color: '#7340f5', label: 'Topic', opacity: 0.5, dashed: true },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                {l.dashed ? (
                  <div className="w-5 h-0 border-t border-dashed" style={{ borderColor: l.color, opacity: l.opacity ?? 1 }} />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color, opacity: l.opacity ?? 1, boxShadow: `0 0 6px ${l.color}60` }} />
                )}
                <span className="text-white/50 text-[10px]">{l.label}</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-1.5 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-5 h-0 border-t-2 border-violet-500 opacity-70" />
                <span className="text-violet-400/70 text-[10px]">AI connection</span>
              </div>
            </div>
          </div>

          {/* Clusters legend */}
          {showClusters && data?.clusters && data.clusters.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-xs">
              {data.clusters.slice(0, 6).map(c => (
                <button key={c.id}
                  onMouseEnter={() => setHoveredCluster(c.id)}
                  onMouseLeave={() => setHoveredCluster(null)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-sm border rounded-full text-[10px] transition-all"
                  style={{ borderColor: c.color + '40', color: c.color + 'cc' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                  {c.label}
                  <span className="opacity-50">({c.count})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Side panel ────────────────────────────────────────────────────── */}
      <div className={cn(
        'w-80 shrink-0 border-l border-white/10 flex flex-col bg-[#0f0d0b] transition-all duration-300',
        selected ? 'translate-x-0' : 'translate-x-full absolute right-0 top-0 bottom-0 pointer-events-none opacity-0'
      )}>
        {selected && (
          <>
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: selected.color, boxShadow: `0 0 8px ${selected.color}` }} />
                  <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: selected.color }}>
                    {TYPE_LABELS[selected.type] ?? selected.type}
                  </span>
                </div>
                <h2 className="text-white text-sm font-medium leading-snug line-clamp-3">{selected.fullTitle}</h2>
              </div>
              <button onClick={() => { setSelected(null); setAiExplain('') }}
                className="ml-3 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-all shrink-0 text-sm">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Summary */}
              {selected.summary && (
                <div className="px-5 py-4 border-b border-white/5">
                  <div className="text-[10px] text-white/30 uppercase tracking-wide font-medium mb-2">Summary</div>
                  <p className="text-white/65 text-xs leading-relaxed">{selected.summary}</p>
                </div>
              )}

              {/* Key insights */}
              {selected.keyInsights && selected.keyInsights.length > 0 && (
                <div className="px-5 py-4 border-b border-white/5">
                  <div className="text-[10px] text-white/30 uppercase tracking-wide font-medium mb-2.5">Key insights</div>
                  <ul className="space-y-2">
                    {selected.keyInsights.slice(0, 3).map((ins, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/55 leading-relaxed">
                        <span className="text-violet-400 shrink-0 mt-0.5">›</span>
                        {ins}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {selected.tags && selected.tags.length > 0 && (
                <div className="px-5 py-4 border-b border-white/5">
                  <div className="text-[10px] text-white/30 uppercase tracking-wide font-medium mb-2">Topics</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-violet-500/15 text-violet-300 border border-violet-500/20 rounded-full text-[10px] font-medium">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related nodes */}
              {selected.relatedNodes && selected.relatedNodes.length > 0 && (
                <div className="px-5 py-4 border-b border-white/5">
                  <div className="text-[10px] text-white/30 uppercase tracking-wide font-medium mb-2.5">Connected nodes</div>
                  <div className="space-y-1.5">
                    {selected.relatedNodes.filter(n => !n.isTag).slice(0, 5).map(rel => (
                      <button key={rel.id}
                        onClick={() => {
                          setSelected({ ...rel, relatedNodes: [] })
                          setAiExplain('')
                          explainConnection(rel.id)
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/10 transition-all text-left group">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: rel.color }} />
                        <span className="text-xs text-white/60 group-hover:text-white/80 leading-snug flex-1 truncate transition-colors">{rel.label}</span>
                        <span className="text-white/20 text-[9px] group-hover:text-violet-400 transition-colors">explain →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI explanation panel */}
              <div className="px-5 py-4 border-b border-white/5">
                <div className="text-[10px] text-white/30 uppercase tracking-wide font-medium mb-2">AI insight</div>
                {aiLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                      ))}
                    </div>
                    <span className="text-white/30 text-xs">Thinking…</span>
                  </div>
                ) : aiExplain ? (
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
                    <p className="text-violet-200/80 text-xs leading-relaxed">{aiExplain}</p>
                  </div>
                ) : (
                  <p className="text-white/25 text-xs italic">Click "Ask AI" below to get an insight about this item.</p>
                )}
              </div>
            </div>

            {/* Panel footer — action buttons */}
            <div className="px-5 py-4 border-t border-white/10 space-y-2">
              <button
                onClick={() => askAiAboutNode(selected)}
                disabled={aiLoading}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2">
                <span>🧠</span>
                {aiLoading ? 'Thinking…' : 'Ask AI about this'}
              </button>
              {!selected.isTag && (
                <Link
                  href={`/dashboard/search?q=${encodeURIComponent(selected.fullTitle)}`}
                  className="block w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-medium transition-all text-center">
                  Find related items in search
                </Link>
              )}
            </div>
          </>
        )}

        {/* Empty panel state */}
        {!selected && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 text-xl mb-3">◈</div>
            <p className="text-white/25 text-xs leading-relaxed">Click any node to explore its summary, insights, and connections</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Cluster halo drawing ─────────────────────────────────────────────────────
function drawClusterHalos(g: any, nodes: GraphNode[], clusters: GraphCluster[], d3: any) {
  g.selectAll('*').remove()
  if (!clusters?.length) return

  clusters.forEach(cluster => {
    const clusterNodes = nodes.filter(n => (n as any).cluster === cluster.id && !n.isTag)
    if (clusterNodes.length < 2) return

    const xs = clusterNodes.map(n => n.x ?? 0)
    const ys = clusterNodes.map(n => n.y ?? 0)
    const cx = xs.reduce((a, b) => a + b, 0) / xs.length
    const cy = ys.reduce((a, b) => a + b, 0) / ys.length
    const r  = Math.max(...clusterNodes.map(n => {
      const dx = (n.x ?? 0) - cx
      const dy = (n.y ?? 0) - cy
      return Math.sqrt(dx*dx + dy*dy)
    })) + 40

    // Halo circle
    g.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', r)
      .attr('fill', cluster.color + '06')
      .attr('stroke', cluster.color + '20')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,6')

    // Cluster label
    g.append('text')
      .attr('x', cx).attr('y', cy - r - 8)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9.5)
      .attr('fill', cluster.color + '60')
      .attr('font-weight', '500')
      .text(cluster.label)
  })
}
