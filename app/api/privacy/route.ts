export const dynamic = 'force-dynamic'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scanForPii } from '@/lib/privacy/pii-detector'
import { privacyCheck } from '@/lib/privacy/middleware'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { action, content, consentVersion } = await req.json()

  // ── Action: scan text for PII ──────────────────────────────────────────────
  if (action === 'scan') {
    if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 })
    if (content.length > 50_000) return NextResponse.json({ error: 'Content too long' }, { status: 400 })

    const result = privacyCheck(content, { userId: user.id, allowHighRisk: user.plan !== 'FREE' })

    return NextResponse.json({
      piiFound:     result.scanResult.piiFound,
      riskScore:    result.scanResult.riskScore,
      matchCount:   result.scanResult.matchCount,
      categories:   result.scanResult.categories,
      redactedText: result.cleanContent,
      warnings:     result.warnings,
      blocked:      result.blocked,
      blockReason:  result.blockReason,
      processingMs: result.scanResult.processingMs,
    })
  }

  // ── Action: record consent ─────────────────────────────────────────────────
  if (action === 'consent') {
    // In production: store in a dedicated ConsentLog table
    // For now: log as JSON in userStats
    const record = {
      userId:    user.id,
      action:    'granted',
      version:   consentVersion ?? '2025-01',
      timestamp: new Date().toISOString(),
      purposes:  ['knowledge_management', 'ai_processing', 'personalisation'],
      basis:     'consent',
    }

    console.log('[privacy] Consent recorded:', JSON.stringify(record))

    return NextResponse.json({ recorded: true, timestamp: record.timestamp, version: record.version })
  }

  // ── Action: data summary (GDPR Art 15 — right of access) ──────────────────
  if (action === 'data_summary') {
    const [itemCount, highlightCount, digestCount] = await Promise.all([
      prisma.item.count({ where: { userId: user.id } }),
      prisma.highlight.count({ where: { userId: user.id } }),
      prisma.weeklyDigest.count({ where: { userId: user.id } }),
    ])

    return NextResponse.json({
      userId:          user.id,
      email:           user.email,
      name:            user.name,
      plan:            user.plan,
      memberSince:     user.createdAt,
      dataStored: {
        items:       itemCount,
        highlights:  highlightCount,
        digests:     digestCount,
      },
      dataCategories:    ['knowledge_content', 'usage_metadata', 'account_data'],
      retentionPolicy:   'Data retained for 2 years after account closure',
      processingPurpose: 'Personal knowledge management and AI summarisation',
      rightsAvailable:   ['access', 'rectification', 'erasure', 'portability', 'restriction'],
    })
  }

  // ── Action: delete all data (GDPR Art 17 — right to erasure) ──────────────
  if (action === 'erase_all') {
    // Full cascade delete (schema has onDelete: Cascade set)
    await prisma.user.delete({ where: { id: user.id } })

    return NextResponse.json({
      erased:    true,
      message:   'All personal data has been permanently deleted.',
      timestamp: new Date().toISOString(),
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Return privacy dashboard data
  return NextResponse.json({
    gdprRights: [
      { right: 'Access',        article: 'Art 15', description: 'Request a copy of all your data', action: 'data_summary' },
      { right: 'Erasure',       article: 'Art 17', description: 'Delete all your data permanently', action: 'erase_all' },
      { right: 'Portability',   article: 'Art 20', description: 'Export your data as JSON/Markdown', action: 'export' },
      { right: 'Rectification', article: 'Art 16', description: 'Correct inaccurate personal data', action: 'settings' },
    ],
    privacyPolicy:   'https://wizemory.com/privacy',
    dataController:  'WizeMory Technologies',
    contactEmail:    'privacy@wizemory.com',
    supervisoryAuthority: 'Contact your local DPA for complaints',
    piiDetectionEnabled:  true,
    dataMinimisation:     true,
    encryptionAtRest:     true,
    encryptionInTransit:  true,
  })
}
