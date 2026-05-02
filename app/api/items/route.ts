export const dynamic    = 'force-dynamic'
export const maxDuration = 60

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processItem } from '@/lib/processItem'
import { PLAN_LIMITS } from '@/types'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const type   = searchParams.get('type')
  const tag    = searchParams.get('tag')
  const cursor = searchParams.get('cursor')
  const limit  = 20

  const items = await prisma.item.findMany({
    where: {
      userId: user.id,
      ...(type ? { type: type as any } : {}),
      ...(tag  ? { tags: { has: tag } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take:    limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = items.length > limit
  return NextResponse.json({
    items:      hasMore ? items.slice(0, limit) : items,
    nextCursor: hasMore ? items[limit - 1].id   : null,
  })
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const planLimit = PLAN_LIMITS[user.plan].items
  if (user.itemCount >= planLimit) {
    return NextResponse.json(
      { error: 'Plan limit reached. Upgrade to Pro for unlimited items.' },
      { status: 403 }
    )
  }

  const form    = await req.formData()
  const type    = form.get('type')    as string
  const url     = form.get('url')     as string | null
  const title   = form.get('title')   as string | null
  const content = form.get('content') as string | null

  // Create item immediately in PROCESSING — UI shows it right away
  const item = await prisma.item.create({
    data: {
      userId:     user.id,
      type:       type as any,
      title:      title ?? url ?? 'Processing…',
      url,
      rawContent: content,
      status:     'PROCESSING',
    },
  })

  await prisma.user.update({
    where: { id: user.id },
    data:  { itemCount: { increment: 1 } },
  })

  console.log(`[items/POST] Created ${item.id}, starting inline processing`)

  // Process INLINE — no HTTP call to self, no fire-and-forget.
  // processItem always resolves to READY or FAILED within 55s.
  const result = await processItem({ itemId: item.id, type, url, title, content })

  // Return the fresh DB state to the client
  const fresh = await prisma.item.findUnique({ where: { id: item.id } })

  console.log(`[items/POST] Finished ${item.id} → ${fresh?.status} in ${result.durationMs}ms`)

  return NextResponse.json({ item: fresh ?? item, processed: result.success }, { status: 201 })
}
