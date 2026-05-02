import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import UpgradeGate from '@/components/ui/UpgradeGate'
import AgentClient from './AgentClient'

export default async function AgentPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')

  const isPro = user.plan !== 'FREE'

  if (!isPro) {
    return (
      <UpgradeGate
        icon="⚡"
        feature="AI Agent"
        description="The AI Agent runs multi-step workflows: summarise URLs, search your knowledge base, generate posts, draft emails — all from one plain-English command."
        bullets={[
          'Chain up to 10 AI steps in one command',
          'Generate LinkedIn posts from your own research',
          'Draft emails grounded in your saved knowledge',
          'Create study notes from any topic you\'ve saved',
        ]}
      />
    )
  }

  return <AgentClient />
}
