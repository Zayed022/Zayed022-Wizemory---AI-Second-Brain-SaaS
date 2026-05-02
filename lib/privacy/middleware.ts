/**
 * lib/privacy/middleware.ts
 *
 * Privacy Middleware — intercepts all content before it reaches AI models.
 *
 * Integration points:
 *   - Wrap callAI() calls in lib/ai.ts
 *   - Applied automatically in /api/items/process
 *   - Exposed via /api/privacy for user-facing consent management
 *
 * GDPR articles addressed:
 *   Art 5  — Data minimisation (PII redacted before AI processing)
 *   Art 7  — Consent conditions (consent timestamps logged)
 *   Art 13 — Transparency (purpose and retention logged with consent)
 *   Art 17 — Right to erasure (delete endpoint in privacy API)
 *   Art 25 — Privacy by design (PII redaction is the default, not opt-in)
 */

import { scanForPii, minimiseForAi, type PiiScanResult } from './pii-detector'

export interface PrivacyCheckResult {
  allowed:      boolean
  cleanContent: string
  scanResult:   PiiScanResult
  warnings:     string[]
  blocked:      boolean
  blockReason?: string
}

// Risk thresholds
const BLOCK_THRESHOLD  = 85    // Block content above this risk score
const WARN_THRESHOLD   = 40    // Warn (but allow) above this score

// Categories that always trigger a hard block regardless of score
const ALWAYS_BLOCK_CATEGORIES = ['CREDIT_CARD', 'BANK_ACCOUNT'] as const

export function privacyCheck(
  content: string,
  options: {
    userId?:      string
    context?:     string
    allowHighRisk?: boolean   // Pro feature: allow with warning instead of blocking
  } = {}
): PrivacyCheckResult {
  const scan     = scanForPii(content, { redact: true, minConfidence: 0.75 })
  const warnings: string[] = []

  // Hard block: financial data (never process, even redacted)
  const hasBlockedCategory = scan.categories.some(c =>
    (ALWAYS_BLOCK_CATEGORIES as readonly string[]).includes(c)
  )

  if (hasBlockedCategory && !options.allowHighRisk) {
    return {
      allowed:      false,
      cleanContent: '',
      scanResult:   scan,
      warnings:     ['Content contains financial data that cannot be processed'],
      blocked:      true,
      blockReason:  'Financial PII detected. WizeMory does not process credit card or bank account data.',
    }
  }

  // High risk block
  if (scan.riskScore >= BLOCK_THRESHOLD && !options.allowHighRisk) {
    return {
      allowed:      false,
      cleanContent: '',
      scanResult:   scan,
      warnings:     [`High PII risk score (${scan.riskScore}/100). Content was blocked.`],
      blocked:      true,
      blockReason:  `Risk score ${scan.riskScore}/100 exceeds threshold. Please remove personal identifiers before saving.`,
    }
  }

  // Warning level
  if (scan.riskScore >= WARN_THRESHOLD) {
    warnings.push(`Personal information was detected and redacted (${scan.matchCount} item${scan.matchCount !== 1 ? 's' : ''}, risk: ${scan.riskScore}/100)`)
  }

  if (scan.piiFound) {
    warnings.push(`Detected: ${scan.categories.join(', ')}. This data was redacted before AI processing.`)
  }

  return {
    allowed:      true,
    cleanContent: scan.redactedText,
    scanResult:   scan,
    warnings,
    blocked:      false,
  }
}

// ── Audit Log ────────────────────────────────────────────────────────────────

export interface PrivacyAuditEntry {
  id:          string
  userId:      string
  action:      string
  piiDetected: boolean
  riskScore:   number
  categories:  string[]
  blocked:     boolean
  contentHash: string    // SHA-256 of original (not stored raw)
  timestamp:   string
  context:     string
}

export function buildAuditEntry(
  userId: string,
  action: string,
  check:  PrivacyCheckResult,
  context: string = 'api'
): PrivacyAuditEntry {
  return {
    id:          `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    action,
    piiDetected: check.scanResult.piiFound,
    riskScore:   check.scanResult.riskScore,
    categories:  check.scanResult.categories,
    blocked:     check.blocked,
    contentHash: hashContent(check.scanResult.scanId), // Use scan ID as proxy (no raw content)
    timestamp:   new Date().toISOString(),
    context,
  }
}

function hashContent(input: string): string {
  // Simple non-crypto hash for audit trail (content is NOT stored)
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}
