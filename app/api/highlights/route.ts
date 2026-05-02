export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const itemId = new URL(req.url).searchParams.get('itemId')
  const highlights = await prisma.highlight.findMany({
    where: { userId: user.id, ...(itemId ? { itemId } : {}) },
    include: { item: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ highlights })
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { itemId, text, note, color, position } = await req.json()
  if (!itemId || !text?.trim()) return NextResponse.json({ error: 'itemId and text required' }, { status: 400 })

  const highlight = await prisma.highlight.create({
    data: { userId: user.id, itemId, text: text.trim(), note, color: color ?? 'yellow', position: position ?? 0 },
  })
  return NextResponse.json({ highlight }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { id } = await req.json()
  await prisma.highlight.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ success: true })
}
