export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CollectionsClient from '@/components/dashboard/CollectionsClient'

export default async function CollectionsPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: { item: { select: { id: true, title: true, type: true, status: true } } },
        orderBy: { order: 'asc' },
        take: 6,
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return <CollectionsClient collections={JSON.parse(JSON.stringify(collections))} />
}
