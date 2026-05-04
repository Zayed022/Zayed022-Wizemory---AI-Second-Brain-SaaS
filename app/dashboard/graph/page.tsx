export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import KnowledgeGraphClient from '@/components/dashboard/KnowledgeGraphClient'
import UpgradeGate from '@/components/ui/UpgradeGate'

export default async function GraphPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')

  // FREE users see the upgrade gate — no graph access
  if (user.plan === 'FREE') {
    return (
      <UpgradeGate
        icon="◎"
        feature="Knowledge Graph"
        description="A live force-directed graph of your entire knowledge base. Every saved item is a node. Every shared topic and AI-discovered connection is an edge."
        bullets={[
          'Visual map of all your saved knowledge',
          'AI-discovered thematic connections between items',
          'Cluster grouping by topic',
          'Click any node to see summary, insights, and Ask AI',
        ]}
      />
    )
  }

  const itemCount = await prisma.item.count({ where: { userId: user.id, status: 'READY' } })

  return <KnowledgeGraphClient itemCount={itemCount} plan={user.plan} />
}