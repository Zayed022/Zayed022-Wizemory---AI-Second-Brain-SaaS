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
    select: {
      id: true,
      referralCode: true,
    },
  })

  if (!user) {
    redirect('/auth/sign-in')
  }

  // Generate referral code if missing
  if (!user.referralCode) {
    const code = crypto.randomUUID().replace(/-/g, '').slice(0, 8)

    user = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        referralCode: code,
      },
      select: {
        id: true,
        referralCode: true,
      },
    })
  }

  return <ReferralClient />
}