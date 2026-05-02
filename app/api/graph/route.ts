export const dynamic    = 'force-dynamic'
export const maxDuration = 60

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { planGate } from '@/lib/gate'

const GEMINI_KEY = process.env.GEMINI_API_KEY ?? ''

async function explainConnection(nodeA: string, nodeB: string, tagShared: string): Promise<string> {
  if (!GEMINI_KEY) return ''
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `In 1 sentence (max 20 words), explain the conceptual connection between "${nodeA}" and "${nodeB}". They share the topic: "${tagShared}". Be specific. No filler.` }] }],
          generationConfig: { maxOutputTokens: 60, temperature: 0.4 },
        }),
        signal: AbortSignal.timeout(5000),
      }
    )
    if (r.ok) { const d = await r.json(); return d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '' }
  } catch {}
  return ''
}

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── Gate: Graph is Pro-only. FREE users get a teaser (5 nodes, no edges) ─
  const gate     = planGate(user.plan)
  const isFree   = !gate.canUseGraph
  const nodeLimit = isFree ? 5 : 120

  const [items, connections] = await Promise.all([
    prisma.item.findMany({
      where: { userId: user.id, status: 'READY' },
      select: { id: true, title: true, type: true, tags: true, summary: true, keyInsights: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: nodeLimit,
    }),
    isFree ? Promise.resolve([]) : prisma.connection.findMany({
      where: { userId: user.id },
      include: { items: { select: { itemId: true } } },
    }),
  ])

  const nodes: any[] = items.map(item => ({
    id: item.id, label: item.title.length > 32 ? item.title.slice(0, 32) + '…' : item.title,
    fullTitle: item.title, type: item.type, tags: item.tags,
    summary: item.summary ?? '', keyInsights: item.keyInsights ?? [],
    size: Math.min(10 + item.tags.length * 2.5, 28),
    color: typeColor(item.type), createdAt: item.createdAt.toISOString(), isTag: false,
  }))

  // Tag clusters
  const tagMap = new Map<string, string[]>()
  items.forEach(item => item.tags.forEach(tag => {
    if (!tagMap.has(tag)) tagMap.set(tag, [])
    tagMap.get(tag)!.push(item.id)
  }))

  const tagNodes: any[] = []
  const tagEdges: any[] = []

  if (!isFree) {
    tagMap.forEach((itemIds, tag) => {
      if (itemIds.length < 2) return
      const tagId = `tag:${tag}`
      tagNodes.push({ id: tagId, label: tag, fullTitle: tag, type: 'TAG', tags: [], summary: `${itemIds.length} items tagged "${tag}"`, keyInsights: [], size: Math.min(8 + itemIds.length * 1.5, 22), color: '#7340f5', isTag: true })
      itemIds.forEach(iid => tagEdges.push({ source: iid, target: tagId, type: 'tag', weight: 0.6 }))
    })
  }

  const connEdges: any[] = []
  connections.forEach(conn => {
    const ids = conn.items.map(ci => ci.itemId)
    for (let i = 0; i < ids.length - 1; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        connEdges.push({ source: ids[i], target: ids[j], type: 'connection', label: (conn as any).title, weight: (conn as any).strength ?? 0.8 })
      }
    }
  })

  const topTagsGlobal = [...tagMap.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 8).map(([tag]) => tag)
  const CLUSTER_PALETTE = ['#7340f5','#3b82f6','#1D9E75','#f59e0b','#ef4444','#ec4899','#06b6d4','#84cc16']
  const clusterColors: Record<string, string> = {}
  topTagsGlobal.forEach((tag, i) => { clusterColors[tag] = CLUSTER_PALETTE[i % CLUSTER_PALETTE.length] })

  nodes.forEach(node => {
    const primaryTag = node.tags.find((t: string) => topTagsGlobal.includes(t))
    node.cluster = primaryTag ?? 'other'
    node.clusterColor = primaryTag ? clusterColors[primaryTag] : '#928c82'
  })

  const allNodes = [...nodes, ...tagNodes]
  const allEdges = isFree ? [] : [...tagEdges, ...connEdges]

  return NextResponse.json({
    nodes: allNodes, edges: allEdges,
    clusters: topTagsGlobal.map(tag => ({ id: tag, label: tag, color: clusterColors[tag], count: tagMap.get(tag)?.length ?? 0 })),
    stats: { totalNodes: allNodes.length, totalEdges: allEdges.length, totalItems: items.length, totalTopics: tagMap.size, aiConnections: connEdges.length },
    gated: isFree,
    gateMessage: isFree ? 'Upgrade to Pro to see your full knowledge graph with AI connections and cluster grouping.' : null,
  })
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const gate = planGate(user.plan)
  if (!gate.canUseGraph) return gate.denyResponse('graph')

  const { nodeATitle, nodeBTitle, sharedTag, type } = await req.json()
  if (type === 'explain_connection') {
    const explanation = await explainConnection(nodeATitle, nodeBTitle, sharedTag ?? '')
    return NextResponse.json({ explanation: explanation || `Both "${nodeATitle}" and "${nodeBTitle}" explore "${sharedTag}" from different angles.` })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}

function typeColor(type: string): string {
  return ({ ARTICLE: '#3b82f6', NOTE: '#7340f5', YOUTUBE: '#ef4444', VOICE: '#f59e0b', PDF: '#ec4899', BOOKMARK: '#1D9E75', PODCAST: '#06b6d4' } as any)[type] ?? '#928c82'
}
