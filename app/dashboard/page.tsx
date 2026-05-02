export const dynamic = 'force-dynamic'

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')

  const clerkUser = await currentUser()
  const email     = clerkUser?.emailAddresses?.[0]?.emailAddress ?? `${userId}@wizemory.local`
  const name      = clerkUser?.fullName ?? null
  const avatarUrl = clerkUser?.imageUrl ?? null

  const user = await prisma.user.upsert({
    where:  { clerkId: userId },
    update: { name, avatarUrl },
    create: { clerkId: userId, email, name, avatarUrl },
  })

  const [items, connections, stats] = await Promise.all([
    prisma.item.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take:    20,
    }),
    prisma.connection.findMany({
      where:   { userId: user.id },
      include: { items: { include: { item: true } } },
      orderBy: { createdAt: 'desc' },
      take:    10,
    }),
    prisma.item.groupBy({
      by:     ['type'],
      where:  { userId: user.id },
      _count: true,
    }),
  ])

  return (
    <DashboardClient
      user={JSON.parse(JSON.stringify(user))}
      initialItems={JSON.parse(JSON.stringify(items))}
      initialConnections={JSON.parse(JSON.stringify(connections))}
      stats={JSON.parse(JSON.stringify(stats))}
    />
  )
}
