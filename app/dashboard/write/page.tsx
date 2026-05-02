import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import UpgradeGate from '@/components/ui/UpgradeGate'
import WriteClient from './WriteClient'

export default async function WritePage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/auth/sign-in')

  if (user.plan === 'FREE') {
    return (
      <UpgradeGate
        icon="✍️"
        feature="AI Writing Assistant"
        description="Generate Twitter threads, LinkedIn posts, blog posts, and newsletters — powered entirely by your own saved research."
        bullets={[
          'Twitter threads from your own saved knowledge',
          'LinkedIn posts that sound like you',
          'Blog posts and newsletter sections',
          'Study notes and summary documents',
        ]}
      />
    )
  }

  return <WriteClient />
}
