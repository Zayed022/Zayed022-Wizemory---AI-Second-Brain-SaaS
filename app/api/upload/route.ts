import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPresignedUploadUrl, buildS3Key } from '@/lib/s3'

const ALLOWED_TYPES: Record<string, string[]> = {
  'application/pdf':  ['pdf'],
  'audio/webm':       ['audio'],
  'audio/mp4':        ['audio'],
  'audio/mpeg':       ['audio'],
  'image/png':        ['screenshot'],
  'image/jpeg':       ['screenshot'],
  'image/webp':       ['screenshot'],
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { filename, contentType, size } = await req.json()

  if (!ALLOWED_TYPES[contentType]) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  if (size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  }

  const folder  = ALLOWED_TYPES[contentType][0]
  const key     = buildS3Key(user.id, folder, filename)
  const url     = await getPresignedUploadUrl(key, contentType)

  return NextResponse.json({ uploadUrl: url, key })
}
