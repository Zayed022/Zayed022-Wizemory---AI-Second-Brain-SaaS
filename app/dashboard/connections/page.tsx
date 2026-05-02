import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ConnectionsClient from '@/components/dashboard/ConnectionsClient'

export default async function ConnectionsPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')

  const connections = await prisma.connection.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: { item: { select: { id: true, title: true, type: true, tags: true } } }
      }
    },
    orderBy: { createdAt: 'desc' },
  })

  return <ConnectionsClient connections={JSON.parse(JSON.stringify(connections))} userId={user.id} />
}
