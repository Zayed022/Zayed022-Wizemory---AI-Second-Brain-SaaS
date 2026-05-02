export const dynamic    = 'force-dynamic'
export const maxDuration = 60

/**
 * /api/items/process
 *
 * Legacy endpoint kept for compatibility (e.g. browser extension v1, direct API callers).
 * All new saves go through inline processing in /api/items/route.ts.
 *
 * This endpoint now delegates directly to processItem() — same guarantee:
 * every item resolves to READY or FAILED, never stays PROCESSING.
 */

import { NextRequest, NextResponse } from 'next/server'
import { processItem } from '@/lib/processItem'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET ?? 'dev-secret'

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { itemId, type, url, title, content } = body
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 })

  const result = await processItem({ itemId, type, url, title, content })

  return NextResponse.json(
    result.success
      ? { success: true, itemId, title: result.title }
      : { success: false, itemId, error: result.error },
    { status: result.success ? 200 : 500 }
  )
}
