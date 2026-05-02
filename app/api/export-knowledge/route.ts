export const dynamic    = 'force-dynamic'
export const maxDuration = 120

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { planGate } from '@/lib/gate'
import {
  itemToMarkdown, sanitiseFilename, buildManifest,
  buildReadme, buildSemanticGraph, type ExportItem,
} from '@/lib/export/knowledge-exporter'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── Gate: Export is Pro-only ─────────────────────────────────────────────
  const gate = planGate(user.plan)
  if (!gate.canExport) return gate.denyResponse('export')

  const format = new URL(req.url).searchParams.get('format') ?? 'zip'

  const [rawItems, collections, highlights, connections] = await Promise.all([
    prisma.item.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    prisma.collection.findMany({
      where: { userId: user.id },
      include: { items: { include: { item: { select: { id: true, title: true, type: true, tags: true } } }, orderBy: { order: 'asc' } } },
    }),
    prisma.highlight.findMany({
      where: { userId: user.id },
      include: { item: { select: { title: true, url: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.connection.findMany({
      where: { userId: user.id },
      include: { items: { include: { item: { select: { id: true, title: true } } } } },
    }),
  ])

  const items: ExportItem[] = rawItems.map(i => ({
    id: i.id, type: i.type, title: i.title, url: i.url,
    summary: i.summary, keyInsights: i.keyInsights, tags: i.tags,
    rawContent: i.rawContent, isFavorite: i.isFavorite,
    createdAt: i.createdAt, updatedAt: i.updatedAt,
  }))

  if (format === 'json') {
    const manifest = buildManifest(items, collections, { id: user.id, email: user.email })
    return NextResponse.json({ manifest, items: items.map(i => ({ ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString() })) }, {
      headers: { 'Content-Disposition': `attachment; filename="wizemory-export-${Date.now()}.json"` },
    })
  }

  const manifest  = buildManifest(items, collections, { id: user.id, email: user.email })
  const readme    = buildReadme(manifest, user.name ?? user.email)
  const graph     = buildSemanticGraph(items, connections)

  let highlightsMd = '# My Highlights\n\n'
  highlights.forEach(h => {
    highlightsMd += `## ${h.item.title}\n\n> ${h.text}\n\n`
    if (h.note) highlightsMd += `*Note: ${h.note}*\n\n`
    if (h.item.url) highlightsMd += `[Source](${h.item.url})\n\n`
    highlightsMd += `---\n\n`
  })

  const statsData = {
    totalItems: items.length, itemsByType: manifest.itemsByType,
    topTopics: manifest.tagCloud.slice(0, 20), streak: user.streak,
    estimatedHours: Math.round((items.length * 7.67) / 60 * 10) / 10,
    exportedAt: new Date().toISOString(),
  }

  const collectionFiles: Record<string, string> = {}
  collections.forEach(col => {
    let md = `# ${col.emoji ?? '📁'} ${col.name}\n\n`
    if (col.description) md += `${col.description}\n\n`
    col.items.forEach((ci, i) => { md += `${i + 1}. ${ci.item.title}\n` })
    collectionFiles[`collections/${sanitiseFilename(col.name)}.md`] = md
  })

  const itemFiles: Record<string, string> = {}
  items.forEach(item => {
    const month = item.createdAt.toISOString().slice(0, 7)
    const slug  = sanitiseFilename(item.title)
    itemFiles[`items/${month}/${slug}-${item.id.slice(-6)}.md`] = itemToMarkdown(item)
  })

  const zipEntries: Record<string, string> = {
    'README.md':                 readme,
    'manifest.json':             JSON.stringify(manifest, null, 2),
    'graph/semantic-graph.json': JSON.stringify(graph, null, 2),
    'graph/connections.json':    JSON.stringify(connections.map(c => ({ id: c.id, title: c.title, description: c.description, strength: c.strength })), null, 2),
    'highlights.md':             highlightsMd,
    'stats.json':                JSON.stringify(statsData, null, 2),
    ...collectionFiles,
    ...itemFiles,
  }

  const zipBuffer = buildZip(zipEntries)
  const uint8 = new Uint8Array(zipBuffer)

  return new NextResponse(uint8, {
    headers: {
      'Content-Type':        'application/zip',
      'Content-Disposition': `attachment; filename="wizemory-knowledge-${new Date().toISOString().split('T')[0]}.zip"`,
      'Content-Length':      zipBuffer.byteLength.toString(),
    },
  })
}

function buildZip(entries: Record<string, string>): Buffer {
  const parts: Buffer[] = []
  const centralDir: Buffer[] = []
  let offset = 0

  for (const [filename, content] of Object.entries(entries)) {
    const fileData   = Buffer.from(content, 'utf-8')
    const nameBuf    = Buffer.from(filename, 'utf-8')
    const crc        = crc32(fileData)
    const now        = new Date()
    const dosDate    = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()
    const dosTime    = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)

    const local = Buffer.allocUnsafe(30 + nameBuf.length)
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6)
    local.writeUInt16LE(0, 8); local.writeUInt16LE(dosTime, 10); local.writeUInt16LE(dosDate, 12)
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(fileData.length, 18); local.writeUInt32LE(fileData.length, 22)
    local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28); nameBuf.copy(local, 30)

    parts.push(local, fileData)

    const cd = Buffer.allocUnsafe(46 + nameBuf.length)
    cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(0, 8)
    cd.writeUInt16LE(0, 10); cd.writeUInt16LE(dosTime, 12); cd.writeUInt16LE(dosDate, 14)
    cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(fileData.length, 20); cd.writeUInt32LE(fileData.length, 24)
    cd.writeUInt16LE(nameBuf.length, 28); cd.writeUInt16LE(0, 30); cd.writeUInt16LE(0, 32)
    cd.writeUInt16LE(0, 34); cd.writeUInt16LE(0, 36); cd.writeUInt32LE(0, 38); cd.writeUInt32LE(offset, 42)
    nameBuf.copy(cd, 46)

    centralDir.push(cd)
    offset += local.length + fileData.length
  }

  const cdBuf = Buffer.concat(centralDir)
  const eocd  = Buffer.allocUnsafe(22)
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6)
  eocd.writeUInt16LE(centralDir.length, 8); eocd.writeUInt16LE(centralDir.length, 10)
  eocd.writeUInt32LE(cdBuf.length, 12); eocd.writeUInt32LE(offset, 16); eocd.writeUInt16LE(0, 20)

  return Buffer.concat([...parts, cdBuf, eocd])
}

function crc32(buf: Buffer): number {
  let crc = 0xFFFFFFFF
  for (const byte of buf) {
    crc ^= byte
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}
