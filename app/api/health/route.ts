import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {}

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = { ok: true, ms: Date.now() - start }
  } catch (err: any) {
    checks.database = { ok: false, error: err.message }
  }

  // Anthropic API check (just verify key is set, don't call API)
  checks.anthropic = {
    ok: Boolean(process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-')),
  }

  // Stripe check
  checks.stripe = {
    ok: Boolean(process.env.STRIPE_SECRET_KEY),
  }

  const allOk    = Object.values(checks).every(c => c.ok)
  const totalMs  = Date.now() - start

  return NextResponse.json(
    {
      status:    allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version:   process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      uptimeMs:  totalMs,
      checks,
    },
    { status: allOk ? 200 : 503 }
  )
}
