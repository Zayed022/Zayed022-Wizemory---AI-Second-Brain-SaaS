import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ items: [] })

  const q = new URL(req.url).searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json({ items: [] })

  // Full-text search across title, summary, tags, rawContent
  const items = await prisma.item.findMany({
    where: {
      userId: user.id,
      OR: [
        { title:      { contains: q, mode: 'insensitive' } },
        { summary:    { contains: q, mode: 'insensitive' } },
        { rawContent: { contains: q, mode: 'insensitive' } },
        { tags:       { has: q.toLowerCase() } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  return NextResponse.json({ items })
}
