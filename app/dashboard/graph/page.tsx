export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import KnowledgeGraphClient from '@/components/dashboard/KnowledgeGraphClient'

export default async function GraphPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')

  const itemCount = await prisma.item.count({ where: { userId: user.id, status: 'READY' } })

  return <KnowledgeGraphClient itemCount={itemCount} plan={user.plan} />
}
