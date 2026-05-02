export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StatsClient from '@/components/dashboard/StatsClient'

export default async function StatsPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')
  return <StatsClient userName={user.name ?? ''} memberSince={user.createdAt.toISOString()} />
}
