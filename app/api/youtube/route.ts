export const dynamic    = 'force-dynamic'
export const maxDuration = 60

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processItem } from '@/lib/processItem'
import { PLAN_LIMITS } from '@/types'

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const p of patterns) { const m = url.match(p); if (m) return m[1] }
  return null
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const planLimit = PLAN_LIMITS[user.plan].items
  if (user.itemCount >= planLimit) {
    return NextResponse.json({ error: 'Plan limit reached' }, { status: 403 })
  }

  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  const videoId = extractYouTubeId(url)
  if (!videoId) return NextResponse.json({ error: 'Not a valid YouTube URL' }, { status: 400 })

  const item = await prisma.item.create({
    data: {
      userId:    user.id,
      type:      'YOUTUBE',
      title:     `YouTube video`,
      url,
      youtubeId: videoId,
      status:    'PROCESSING',
    },
  })

  await prisma.user.update({ where: { id: user.id }, data: { itemCount: { increment: 1 } } })

  console.log(`[youtube/POST] Created ${item.id}, processing inline`)

  // Inline processing — same guarantee as items/route
  const result = await processItem({ itemId: item.id, type: 'YOUTUBE', url, title: `YouTube: ${url}` })
  const fresh  = await prisma.item.findUnique({ where: { id: item.id } })

  console.log(`[youtube/POST] Finished ${item.id} → ${fresh?.status} in ${result.durationMs}ms`)

  return NextResponse.json({ item: fresh ?? item, processed: result.success }, { status: 201 })
}
