import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const { type, data } = payload

  if (type === 'user.created') {
    const email = data.email_addresses?.[0]?.email_address ?? ''
    const name  = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()

    await prisma.user.upsert({
      where:  { clerkId: data.id },
      update: {},
      create: { clerkId: data.id, email, name: name || null, avatarUrl: data.image_url ?? null },
    })

    if (email) sendWelcomeEmail(email, name).catch(console.error)
  }

  if (type === 'user.updated') {
    const name = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()
    await prisma.user.updateMany({
      where: { clerkId: data.id },
      data:  { name: name || null, avatarUrl: data.image_url ?? null },
    })
  }

  if (type === 'user.deleted') {
    await prisma.user.deleteMany({ where: { clerkId: data.id } })
  }

  return NextResponse.json({ success: true })
}
