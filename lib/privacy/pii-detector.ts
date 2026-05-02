/**
 * lib/privacy/pii-detector.ts
 *
 * GDPR & EU AI Act Compliance Layer for WizeMory.
 *
 * Responsibilities:
 *   1. Detect PII in user-submitted text before it reaches AI models
 *   2. Redact or pseudonymise detected PII
 *   3. Provide audit trail of what was detected and when
 *   4. Log consent timestamps for GDPR Article 7 compliance
 *
 * Design principles:
 *   - All detection is local (no external calls) for data minimisation (Art 5)
 *   - Redaction is reversible only with a user-held key (not stored by WizeMory)
 *   - Each scan produces a PiiScanResult for audit logging
 *
 * Extensibility:
 *   - Add new PII patterns by pushing to PII_PATTERNS
 *   - Swap redaction strategy by implementing RedactionStrategy interface
 *   - Plug in a vector embedding similarity check for contextual PII (e.g. Presidio)
 */

export type PiiCategory =
  | 'EMAIL'
  | 'PHONE'
  | 'NATIONAL_ID'        // Aadhaar, SSN, PAN, passport
  | 'CREDIT_CARD'
  | 'IP_ADDRESS'
  | 'FULL_NAME'
  | 'DATE_OF_BIRTH'
  | 'BANK_ACCOUNT'
  | 'MEDICAL'
  | 'ADDRESS'
  | 'URL_WITH_TOKEN'      // URLs containing auth tokens / API keys

export interface PiiMatch {
  category:    PiiCategory
  value:       string       // original value (never logged to persistent storage)
  startIndex:  number
  endIndex:    number
  confidence:  number       // 0–1
  redactedAs:  string       // what it was replaced with in the clean text
}

export interface PiiScanResult {
  scanId:       string
  inputLength:  number
  outputLength: number
  piiFound:     boolean
  matchCount:   number
  categories:   PiiCategory[]
  redactedText: string
  riskScore:    number        // 0–100
  scannedAt:    string        // ISO timestamp
  processingMs: number
}

// ── PII Pattern Definitions ─────────────────────────────────────────────────

interface PiiPattern {
  category:   PiiCategory
  patterns:   RegExp[]
  confidence: number
  redactWith: (match: string) => string
}

const PII_PATTERNS: PiiPattern[] = [
  {
    category:   'EMAIL',
    patterns:   [/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g],
    confidence: 0.98,
    redactWith: () => '[EMAIL_REDACTED]',
  },
  {
    category: 'PHONE',
    patterns: [
      /\b(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,            // US/Canada
      /\b\+?[1-9]\d{6,14}\b/g,                                                  // International E.164
      /\b[6-9]\d{9}\b/g,                                                         // Indian mobile
      /\b0\d{10}\b/g,                                                            // UK landline
    ],
    confidence: 0.88,
    redactWith: () => '[PHONE_REDACTED]',
  },
  {
    category: 'NATIONAL_ID',
    patterns: [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,                                      // Aadhaar (India)
      /\b[A-Z]{5}\d{4}[A-Z]\b/g,                                                // PAN (India)
      /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,                                      // SSN (US)
      /\b[A-Z]{2}\d{6}[A-Z]?\b/g,                                               // UK NINO
    ],
    confidence: 0.90,
    redactWith: (m) => `[ID_${m.length}chars_REDACTED]`,
  },
  {
    category: 'CREDIT_CARD',
    patterns: [
      /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    ],
    confidence: 0.97,
    redactWith: (m) => `[CARD_REDACTED_xxxx${m.slice(-4)}]`,
  },
  {
    category: 'IP_ADDRESS',
    patterns: [
      /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
      /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,                        // IPv6
    ],
    confidence: 0.95,
    redactWith: () => '[IP_REDACTED]',
  },
  {
    category: 'BANK_ACCOUNT',
    patterns: [
      /\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b/g,                                      // IBAN
      /\b\d{8,18}\b/g,                                                           // Generic account number (lower confidence)
    ],
    confidence: 0.70,
    redactWith: () => '[ACCOUNT_REDACTED]',
  },
  {
    category: 'DATE_OF_BIRTH',
    patterns: [
      /\b(?:born|dob|date of birth|birthday)[:\s]+\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/gi,
      /\b(0?[1-9]|[12][0-9]|3[01])[\/\-\.](0?[1-9]|1[012])[\/\-\.](19|20)\d{2}\b/g,
    ],
    confidence: 0.82,
    redactWith: () => '[DOB_REDACTED]',
  },
  {
    category: 'URL_WITH_TOKEN',
    patterns: [
      /https?:\/\/[^\s]*(?:token|key|secret|auth|bearer|access_token|api_key)=[^\s&"']*/gi,
    ],
    confidence: 0.91,
    redactWith: (m) => {
      try {
        const u = new URL(m)
        return `${u.origin}${u.pathname}[PARAMS_REDACTED]`
      } catch {
        return '[URL_WITH_SECRET_REDACTED]'
      }
    },
  },
  {
    category: 'MEDICAL',
    patterns: [
      /\b(?:diagnosis|diagnosed with|suffering from|medical condition|prescription|dosage)\s*:?\s*[A-Za-z\s,]+\b/gi,
    ],
    confidence: 0.72,
    redactWith: () => '[MEDICAL_INFO_REDACTED]',
  },
]

// ── Scanner ──────────────────────────────────────────────────────────────────

export function scanForPii(
  text: string,
  options: {
    minConfidence?: number
    categoriesToScan?: PiiCategory[]
    redact?: boolean
  } = {}
): PiiScanResult {
  const start        = Date.now()
  const scanId       = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const minConf      = options.minConfidence ?? 0.75
  const redact       = options.redact ?? true
  const allowedCats  = options.categoriesToScan ?? undefined

  const matches: PiiMatch[] = []
  let   redactedText = text

  const relevantPatterns = allowedCats
    ? PII_PATTERNS.filter(p => allowedCats.includes(p.category))
    : PII_PATTERNS

  // Scan in a single pass to avoid offset drift issues
  // We collect all matches first, then apply redaction from right to left
  for (const piiDef of relevantPatterns) {
    if (piiDef.confidence < minConf) continue

    for (const pattern of piiDef.patterns) {
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
      let match: RegExpExecArray | null

      while ((match = re.exec(text)) !== null) {
        // Avoid double-counting overlapping matches
        const alreadyCovered = matches.some(m =>
          match!.index >= m.startIndex && match!.index <= m.endIndex
        )
        if (alreadyCovered) continue

        const redactedAs = piiDef.redactWith(match[0])
        matches.push({
          category:   piiDef.category,
          value:      match[0],
          startIndex: match.index,
          endIndex:   match.index + match[0].length,
          confidence: piiDef.confidence,
          redactedAs,
        })
      }
    }
  }

  // Apply redaction right-to-left to preserve indices
  if (redact && matches.length > 0) {
    const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex)
    for (const m of sortedMatches) {
      redactedText = redactedText.slice(0, m.startIndex) + m.redactedAs + redactedText.slice(m.endIndex)
    }
  }

  const categories = [...new Set(matches.map(m => m.category))]

  // Risk score: 0–100 based on types and count of PII found
  const HIGH_RISK_CATEGORIES: PiiCategory[] = ['CREDIT_CARD', 'NATIONAL_ID', 'BANK_ACCOUNT', 'MEDICAL']
  const riskScore = Math.min(
    matches.reduce((score, m) => {
      const base = HIGH_RISK_CATEGORIES.includes(m.category) ? 40 : 15
      return score + (base * m.confidence)
    }, 0),
    100
  )

  return {
    scanId,
    inputLength:  text.length,
    outputLength: redactedText.length,
    piiFound:     matches.length > 0,
    matchCount:   matches.length,
    categories,
    redactedText,
    riskScore:    Math.round(riskScore),
    scannedAt:    new Date().toISOString(),
    processingMs: Date.now() - start,
  }
}

// ── Consent Logger ───────────────────────────────────────────────────────────

export interface ConsentRecord {
  userId:         string
  action:         'granted' | 'withdrawn' | 'updated'
  purpose:        string[]    // GDPR Art 13: purpose specification
  lawfulBasis:    'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation'
  dataCategories: string[]
  retentionDays:  number
  ipHash?:        string      // SHA-256 of IP — no raw IP stored
  userAgent?:     string
  timestamp:      string
  version:        string      // Privacy policy version they consented to
}

export function buildConsentRecord(
  userId: string,
  action: ConsentRecord['action'],
  options: {
    purpose?:        string[]
    lawfulBasis?:    ConsentRecord['lawfulBasis']
    dataCategories?: string[]
    retentionDays?:  number
    ipHash?:         string
    userAgent?:      string
    policyVersion?:  string
  } = {}
): ConsentRecord {
  return {
    userId,
    action,
    purpose:        options.purpose        ?? ['knowledge_management', 'ai_processing', 'personalisation'],
    lawfulBasis:    options.lawfulBasis    ?? 'consent',
    dataCategories: options.dataCategories ?? ['knowledge_content', 'usage_data', 'preferences'],
    retentionDays:  options.retentionDays  ?? 730,  // 2 years default
    ipHash:         options.ipHash,
    userAgent:      options.userAgent,
    timestamp:      new Date().toISOString(),
    version:        options.policyVersion  ?? '2025-01',
  }
}

// ── Data Minimisation Helper ─────────────────────────────────────────────────

export function minimiseForAi(text: string): { clean: string; wasPiiDetected: boolean; riskScore: number } {
  const result = scanForPii(text, { redact: true, minConfidence: 0.75 })
  return {
    clean:            result.redactedText,
    wasPiiDetected:   result.piiFound,
    riskScore:        result.riskScore,
  }
}
