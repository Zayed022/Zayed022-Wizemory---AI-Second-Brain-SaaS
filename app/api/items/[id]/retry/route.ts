export const dynamic    = 'force-dynamic'
export const maxDuration = 60

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processItem } from '@/lib/processItem'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item = await prisma.item.findFirst({
    where: { id: params.id, userId: user.id },
  })

  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  if (item.status === 'READY') {
    return NextResponse.json({ message: 'Item is already processed', item })
  }

  console.log(`[retry] User ${user.id} retrying item ${item.id} (was ${item.status})`)

  // Reset to PROCESSING before retrying
  await prisma.item.update({
    where: { id: item.id },
    data:  { status: 'PROCESSING', summary: null },
  })

  const result = await processItem({
    itemId:  item.id,
    type:    item.type,
    url:     item.url,
    title:   item.title,
    content: item.rawContent,
  })

  const fresh = await prisma.item.findUnique({ where: { id: item.id } })

  return NextResponse.json({
    success: result.success,
    status:  fresh?.status,
    item:    fresh,
    error:   result.error,
  })
}
