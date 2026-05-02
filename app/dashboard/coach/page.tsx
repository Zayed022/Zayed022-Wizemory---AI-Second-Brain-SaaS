export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CoachClient from '@/components/dashboard/CoachClient'

export default async function CoachPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')
  return <CoachClient userName={user.name ?? ''} plan={user.plan} streak={user.streak} />
}
