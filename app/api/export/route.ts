import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const format = new URL(req.url).searchParams.get('format') ?? 'json'

  const items = await prisma.item.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, type: true, title: true, url: true,
      summary: true, keyInsights: true, tags: true,
      rawContent: true, status: true, isPublic: true,
      createdAt: true, updatedAt: true,
    },
  })

  if (format === 'markdown') {
    const md = items.map(item => [
      `# ${item.title}`,
      item.url ? `**Source:** ${item.url}` : '',
      `**Type:** ${item.type}`,
      `**Saved:** ${item.createdAt.toISOString().split('T')[0]}`,
      `**Tags:** ${item.tags.join(', ')}`,
      '',
      item.summary ? `## Summary\n${item.summary}` : '',
      '',
      item.keyInsights.length > 0
        ? `## Key Insights\n${item.keyInsights.map(i => `- ${i}`).join('\n')}`
        : '',
      '',
      '---',
    ].filter(Boolean).join('\n')).join('\n\n')

    return new NextResponse(md, {
      headers: {
        'Content-Type':        'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="wizemory-export-${Date.now()}.md"`,
      },
    })
  }

  // Default: JSON
  const payload = {
    exportedAt: new Date().toISOString(),
    user: { email: user.email, name: user.name, plan: user.plan },
    itemCount: items.length,
    items,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="wizemory-export-${Date.now()}.json"`,
    },
  })
}
