export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const collection = await prisma.collection.findFirst({ where: { id: params.id, userId: user.id } })
  if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

  const { itemId, action } = await req.json()

  if (action === 'remove') {
    await prisma.collectionItem.deleteMany({ where: { collectionId: params.id, itemId } })
    await prisma.collection.update({ where: { id: params.id }, data: { itemCount: { decrement: 1 } } })
  } else {
    await prisma.collectionItem.upsert({
      where: { collectionId_itemId: { collectionId: params.id, itemId } },
      update: {},
      create: { collectionId: params.id, itemId },
    })
    await prisma.collection.update({ where: { id: params.id }, data: { itemCount: { increment: 1 } } })
  }

  return NextResponse.json({ success: true })
}
