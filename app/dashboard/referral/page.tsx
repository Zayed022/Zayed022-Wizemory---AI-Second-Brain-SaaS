export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ReferralClient from '@/components/dashboard/ReferralClient'

export default async function ReferralPage() {
  const { userId } = auth()

  if (!userId) {
    redirect('/auth/sign-in')
  }

  let user = await prisma.user.findUnique({
    where: {
      clerkId: userId,
    },
  })

  if (!user) {
    redirect('/auth/sign-in')
  }

  // Generate referral code if none exists
  if (!user.referralCode) {
    const code = Math.random()
      .toString(36)
      .substring(2, 10)

    user = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        referralCode: code,
      },
    })
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    'https://wizemory.com'

    const progressTotal    = 3
const freeMonthsEarned = Math.floor(user.referralCount / progressTotal)
const progress         = user.referralCount % progressTotal
  return (
    <ReferralClient
      code={user.referralCode!}
      referralUrl={`${appUrl}/auth/sign-up?ref=${user.referralCode}`}
      referralCount={user.referralCount}
      plan={user.plan}
    />
  )
}