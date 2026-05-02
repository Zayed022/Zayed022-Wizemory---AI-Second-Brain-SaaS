import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function ArticlesPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')

  const items = await prisma.item.findMany({
    where: { userId: user.id, type: 'ARTICLE' },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  return (
    <DashboardClient
      user={user as any}
      initialItems={JSON.parse(JSON.stringify(items))}
      initialConnections={[]}
      stats={[{ type: 'ARTICLE', _count: items.length }]}
    />
  )
}
