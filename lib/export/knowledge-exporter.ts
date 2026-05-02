/**
 * lib/export/knowledge-exporter.ts
 *
 * Knowledge Export Engine for WizeMory.
 *
 * Generates a structured ZIP file containing:
 *   /manifest.json          — machine-readable metadata and index
 *   /README.md              — human-readable overview
 *   /items/YYYY-MM/         — items grouped by month
 *     *.md                  — full Markdown with frontmatter
 *   /graph/
 *     semantic-graph.json   — full node/edge graph
 *     connections.json      — AI-discovered connections
 *   /collections/           — one .md per collection
 *   /highlights.md          — all highlights with source context
 *   /stats.json             — lifetime learning statistics
 *   /export-meta.json       — export provenance and checksums
 *
 * Design for extensibility:
 *   - Each section is produced by a discrete async generator function
 *   - New sections can be added by pushing to EXPORT_SECTIONS array
 *   - Output format (ZIP) is swappable via ExportAdapter interface
 *   - All functions are pure given the same Prisma data
 */

export interface ExportItem {
  id:          string
  type:        string
  title:       string
  url:         string | null
  summary:     string | null
  keyInsights: string[]
  tags:        string[]
  rawContent:  string | null
  isFavorite:  boolean
  createdAt:   Date
  updatedAt:   Date
}

export interface ExportManifest {
  version:       string
  exportedAt:    string
  userId:        string
  userEmail:     string
  totalItems:    number
  totalWords:    number
  dateRange:     { earliest: string; latest: string }
  itemsByType:   Record<string, number>
  tagCloud:      Array<{ tag: string; count: number }>
  collections:   Array<{ name: string; itemCount: number }>
  sections:      string[]
  schema:        string
}

// ── Markdown Formatters ──────────────────────────────────────────────────────

export function itemToMarkdown(item: ExportItem): string {
  const lines: string[] = []

  // YAML frontmatter (compatible with Obsidian, Logseq, Roam)
  lines.push('---')
  lines.push(`id: ${item.id}`)
  lines.push(`type: ${item.type}`)
  lines.push(`title: "${item.title.replace(/"/g, '\\"')}"`)
  if (item.url)       lines.push(`url: ${item.url}`)
  if (item.isFavorite) lines.push('favorite: true')
  if (item.tags.length) lines.push(`tags: [${item.tags.map(t => `"${t}"`).join(', ')}]`)
  lines.push(`created: ${item.createdAt.toISOString().split('T')[0]}`)
  lines.push(`updated: ${item.updatedAt.toISOString().split('T')[0]}`)
  lines.push('source: wizemory')
  lines.push('---')
  lines.push('')

  // Title
  lines.push(`# ${item.title}`)
  lines.push('')

  // Metadata callout
  if (item.url) {
    lines.push(`> 🔗 **Source:** [${item.url}](${item.url})`)
    lines.push('')
  }

  // Summary
  if (item.summary) {
    lines.push('## Summary')
    lines.push('')
    lines.push(item.summary)
    lines.push('')
  }

  // Key insights
  if (item.keyInsights.length > 0) {
    lines.push('## Key Insights')
    lines.push('')
    item.keyInsights.forEach(ins => lines.push(`- ${ins}`))
    lines.push('')
  }

  // Tags
  if (item.tags.length > 0) {
    lines.push('## Tags')
    lines.push('')
    lines.push(item.tags.map(t => `#${t}`).join('  '))
    lines.push('')
  }

  // Raw content (if short enough to be useful)
  if (item.rawContent && item.rawContent.length > 0 && item.rawContent.length < 5000) {
    lines.push('## Full Content')
    lines.push('')
    lines.push(item.rawContent)
    lines.push('')
  }

  return lines.join('\n')
}

export function sanitiseFilename(title: string): string {
  return title
    .slice(0, 80)
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/, '')
    .toLowerCase()
    || 'untitled'
}

export function buildManifest(
  items: ExportItem[],
  collections: any[],
  user: { id: string; email: string }
): ExportManifest {
  const sortedByDate = [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const totalWords   = items.reduce((n, i) => n + ((i.rawContent ?? i.summary ?? '').split(/\s+/).length), 0)

  const itemsByType: Record<string, number> = {}
  items.forEach(i => { itemsByType[i.type] = (itemsByType[i.type] ?? 0) + 1 })

  const tagFreq: Record<string, number> = {}
  items.forEach(i => i.tags.forEach(t => { tagFreq[t] = (tagFreq[t] ?? 0) + 1 }))
  const tagCloud = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 50).map(([tag, count]) => ({ tag, count }))

  return {
    version:    '3.0',
    exportedAt: new Date().toISOString(),
    userId:     user.id,
    userEmail:  user.email,
    totalItems: items.length,
    totalWords,
    dateRange: {
      earliest: sortedByDate[0]?.createdAt.toISOString() ?? '',
      latest:   sortedByDate[sortedByDate.length - 1]?.createdAt.toISOString() ?? '',
    },
    itemsByType,
    tagCloud,
    collections: collections.map(c => ({ name: c.name, itemCount: c.itemCount ?? 0 })),
    sections:   ['items/', 'graph/', 'collections/', 'highlights.md', 'stats.json'],
    schema:     'https://wizemory.com/schema/export/v3',
  }
}

export function buildReadme(manifest: ExportManifest, userName: string): string {
  const lines = [
    `# WizeMory Knowledge Export`,
    ``,
    `**Exported by:** ${userName}  `,
    `**Date:** ${new Date(manifest.exportedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  `,
    `**Total items:** ${manifest.totalItems.toLocaleString()}  `,
    `**Estimated words read:** ${manifest.totalWords.toLocaleString()}  `,
    ``,
    `## Contents`,
    ``,
    `| Folder / File | Description |`,
    `|---|---|`,
    `| \`items/\` | All saved knowledge items in Markdown with YAML frontmatter |`,
    `| \`graph/semantic-graph.json\` | Full knowledge graph (nodes + edges) |`,
    `| \`graph/connections.json\` | AI-discovered thematic connections |`,
    `| \`collections/\` | Your curated collections as Markdown |`,
    `| \`highlights.md\` | All saved highlights and annotations |`,
    `| \`stats.json\` | Lifetime learning statistics |`,
    `| \`manifest.json\` | Machine-readable export index |`,
    ``,
    `## Knowledge Breakdown`,
    ``,
    `### Items by type`,
    ...Object.entries(manifest.itemsByType).map(([t, n]) => `- **${t}**: ${n}`),
    ``,
    `### Top topics`,
    ...manifest.tagCloud.slice(0, 10).map(({ tag, count }) => `- **${tag}** (${count} items)`),
    ``,
    `## Import Instructions`,
    ``,
    `### Obsidian`,
    `1. Open Obsidian → Create new vault or open existing`,
    `2. Copy the \`items/\` folder contents into your vault`,
    `3. The YAML frontmatter and \`#tags\` are fully compatible`,
    ``,
    `### Notion`,
    `1. Open Notion → Import → Markdown & CSV`,
    `2. Upload individual \`.md\` files or the entire \`items/\` folder`,
    ``,
    `### Logseq`,
    `1. Copy \`.md\` files into your Logseq graph's \`pages/\` folder`,
    `2. The YAML frontmatter imports as page properties`,
    ``,
    `---`,
    `*Exported from [WizeMory](https://wizemory.com) — Your AI Second Brain*`,
  ]

  return lines.join('\n')
}

export function buildSemanticGraph(items: ExportItem[], connections: any[]): any {
  const nodes = items.map(item => ({
    id:    item.id,
    label: item.title,
    type:  item.type,
    tags:  item.tags,
    date:  item.createdAt.toISOString().split('T')[0],
    size:  Math.min(5 + item.keyInsights.length, 20),
  }))

  // Tag-based edges
  const tagMap = new Map<string, string[]>()
  items.forEach(i => i.tags.forEach(t => {
    if (!tagMap.has(t)) tagMap.set(t, [])
    tagMap.get(t)!.push(i.id)
  }))

  const tagEdges: any[] = []
  tagMap.forEach((ids, tag) => {
    if (ids.length < 2) return
    for (let i = 0; i < ids.length - 1; i++) {
      for (let j = i + 1; j < Math.min(ids.length, i + 4); j++) {
        tagEdges.push({ source: ids[i], target: ids[j], type: 'shared_tag', weight: 0.5, label: tag })
      }
    }
  })

  // AI-connection edges
  const aiEdges = connections.flatMap(c => {
    const ids = c.items?.map((ci: any) => ci.itemId ?? ci.item?.id) ?? []
    return ids.slice(0, -1).map((id: string, i: number) => ({
      source: id, target: ids[i + 1],
      type: 'ai_connection', weight: c.strength ?? 0.8, label: c.title,
    }))
  })

  return {
    nodes, edges: [...tagEdges, ...aiEdges],
    meta: {
      nodeCount: nodes.length,
      edgeCount: tagEdges.length + aiEdges.length,
      generatedAt: new Date().toISOString(),
      format: 'wizemory-graph-v1',
    },
  }
}
