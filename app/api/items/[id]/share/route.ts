import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { isPublic } = await req.json()
  const slug = isPublic ? generateSlug() : null

  const item = await prisma.item.updateMany({
    where: { id: params.id, userId: user.id },
    data: { isPublic, publicSlug: slug },
  })

  return NextResponse.json({ success: true, slug })
}
