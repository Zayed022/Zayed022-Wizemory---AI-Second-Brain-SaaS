export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import HighlightsClient from '@/components/dashboard/HighlightsClient'

export default async function HighlightsPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')

  const highlights = await prisma.highlight.findMany({
    where:   { userId: user.id },
    include: { item: { select: { id: true, title: true, url: true, type: true } } },
    orderBy: { createdAt: 'desc' },
    take:    100,
  })

  return <HighlightsClient highlights={JSON.parse(JSON.stringify(highlights))} />
}
