export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CoachClient from '@/components/dashboard/CoachClient'
import UpgradeGate from '@/components/ui/UpgradeGate'

export default async function CoachPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')

  if (user.plan === 'FREE') {
    return (
      <UpgradeGate
        icon="🧠"
        feature="AI Memory Coach"
        description="Get a daily personalised brief: what to review, what you are forgetting, and what patterns the AI sees across your knowledge base."
        bullets={[
          'Daily personalised learning brief',
          'AI-detected knowledge gaps and blind spots',
          'Optimal review scheduling based on your activity',
          'Streak tracking and habit formation insights',
        ]}
      />
    )
  }

  return <CoachClient userName={user.name ?? ''} plan={user.plan} streak={user.streak} />
}