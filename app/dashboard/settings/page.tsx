import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SettingsClient from '@/components/dashboard/SettingsClient'

export default async function SettingsPage() {
  const { userId } = auth()
  if (!userId) redirect('/auth/sign-in')

  const [clerkUser, dbUser] = await Promise.all([
    currentUser(),
    prisma.user.findUnique({ where: { clerkId: userId } }),
  ])

  if (!dbUser) redirect('/auth/sign-in')

  return (
    <SettingsClient
      user={JSON.parse(JSON.stringify(dbUser))}
      clerkUser={{ name: clerkUser?.fullName, email: clerkUser?.emailAddresses[0]?.emailAddress, imageUrl: clerkUser?.imageUrl }}
    />
  )
}
