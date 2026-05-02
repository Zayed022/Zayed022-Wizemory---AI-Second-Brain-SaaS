export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    include: { items: { include: { item: true }, orderBy: { order: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ collections })
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, description, emoji, color } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const collection = await prisma.collection.create({
    data: { userId: user.id, name: name.trim(), description, emoji: emoji ?? '📚', color: color ?? '#7340f5' },
  })
  return NextResponse.json({ collection }, { status: 201 })
}
