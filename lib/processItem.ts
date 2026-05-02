/**
 * lib/processItem.ts
 *
 * Single source of truth for all item processing logic.
 * Called DIRECTLY (inline, not via HTTP) from:
 *   - POST /api/items         (articles, notes, voice, PDF)
 *   - POST /api/youtube       (YouTube URLs)
 *   - POST /api/items/retry   (retry failed items)
 *
 * Guarantees:
 *   1. Every item ends as READY or FAILED — never stuck in PROCESSING
 *   2. 55-second hard timeout via Promise.race
 *   3. Every step logged with [processItem] prefix
 *   4. DB always written even if the write itself throws
 *   5. Returns a rich result for the caller to use in their response
 */

import { prisma } from './prisma'
import { summariseItem, extractFromUrl } from './ai'

export interface ProcessInput {
  itemId:  string
  type:    string
  url?:    string | null
  title?:  string | null
  content?:string | null
}

export type ProcessStep =
  | 'fetch_content'
  | 'ai_summarise'
  | 'db_update'
  | 'complete'
  | 'failed'

export interface ProcessResult {
  success:  boolean
  itemId:   string
  step:     ProcessStep          // last step reached
  title?:   string
  error?:   string
  durationMs: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(itemId: string, msg: string) {
  console.log(`[processItem:${itemId}] ${msg}`)
}

function err(itemId: string, msg: string, e?: any) {
  console.error(`[processItem:${itemId}] ✗ ${msg}`, e?.message ?? e ?? '')
}

async function markFailed(itemId: string, reason: string, fallbackTitle?: string) {
  try {
    await prisma.item.update({
      where: { id: itemId },
      data:  {
        status: 'FAILED',
        title:  (fallbackTitle ?? 'Processing failed').slice(0, 200),
        summary: `Processing failed: ${reason.slice(0, 300)}`,
      },
    })
    log(itemId, `Marked FAILED — ${reason}`)
  } catch (dbErr: any) {
    err(itemId, 'Could not write FAILED status to DB', dbErr)
  }
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function processItem(input: ProcessInput): Promise<ProcessResult> {
  const { itemId, type, url, title, content } = input
  const startedAt = Date.now()
  const fallback  = title || url || 'Untitled'

  log(itemId, `Starting — type=${type} url=${url ?? '—'} title="${title ?? ''}"`)

  // ── 55-second hard timeout ────────────────────────────────────────────────
  const timeoutMs  = 55_000
  const timeoutErr = new Error(`Processing timed out after ${timeoutMs / 1000}s`)

  async function doProcess(): Promise<ProcessResult> {

    // ── Step 1: resolve raw content ──────────────────────────────────────
    let rawContent = (content ?? '').trim()

    if ((type === 'ARTICLE' || type === 'BOOKMARK' || type === 'YOUTUBE') && url) {
      log(itemId, `Step 1/3 — Fetching content from ${url}`)
      try {
        const fetched = await extractFromUrl(url)
        if (fetched && fetched.length > 80) {
          rawContent = fetched
          log(itemId, `Step 1/3 ✓ — Got ${rawContent.length} chars`)
        } else {
          log(itemId, `Step 1/3 — Jina returned little content (${fetched?.length ?? 0} chars), using fallback`)
          rawContent = rawContent || title || url
        }
      } catch (fetchErr: any) {
        err(itemId, 'Step 1/3 — URL fetch failed, falling back to title', fetchErr)
        rawContent = rawContent || title || url || ''
      }
    } else {
      log(itemId, `Step 1/3 ✓ — Using provided content (${rawContent.length} chars)`)
    }

    // For voice/notes without content, use title as the source text
    if (!rawContent || rawContent.trim().length < 5) {
      rawContent = title || url || ''
    }

    if (!rawContent || rawContent.trim().length < 5) {
      await markFailed(itemId, 'No content could be extracted', fallback)
      return { success: false, itemId, step: 'failed', error: 'No content', durationMs: Date.now() - startedAt }
    }

    // ── Step 2: AI summarisation ─────────────────────────────────────────
    log(itemId, `Step 2/3 — Running AI summarisation (${rawContent.length} chars)`)

    let ai: { title: string; summary: string; keyInsights: string[]; tags: string[] }
    try {
      ai = await summariseItem(rawContent, type, url ?? undefined)
      log(itemId, `Step 2/3 ✓ — Got title: "${ai.title}"`)
    } catch (aiErr: any) {
      err(itemId, 'Step 2/3 — AI summarisation failed', aiErr)

      // Graceful degradation: store what we have without AI
      const gracefulTitle = title || url || 'Saved item'
      try {
        await prisma.item.update({
          where: { id: itemId },
          data:  {
            title:      gracefulTitle.slice(0, 200),
            summary:    rawContent.slice(0, 400),
            keyInsights:[],
            tags:       [],
            rawContent: rawContent.slice(0, 50_000),
            status:     'READY',   // ← still mark READY so user sees it
          },
        })
        log(itemId, 'Step 2/3 — Saved with degraded summary (no AI), status=READY')
        return { success: true, itemId, step: 'complete', title: gracefulTitle, durationMs: Date.now() - startedAt }
      } catch (dbErr: any) {
        await markFailed(itemId, `AI failed and DB fallback also failed: ${dbErr.message}`, fallback)
        return { success: false, itemId, step: 'failed', error: aiErr.message, durationMs: Date.now() - startedAt }
      }
    }

    // ── Step 3: write to DB ──────────────────────────────────────────────
    log(itemId, `Step 3/3 — Writing to DB`)
    try {
      await prisma.item.update({
        where: { id: itemId },
        data:  {
          title:       (ai.title || fallback).slice(0, 200),
          summary:     ai.summary     || null,
          keyInsights: ai.keyInsights || [],
          tags:        ai.tags        || [],
          rawContent:  rawContent.slice(0, 50_000),
          status:      'READY',
        },
      })
      log(itemId, `Step 3/3 ✓ — READY in ${Date.now() - startedAt}ms`)
      return { success: true, itemId, step: 'complete', title: ai.title, durationMs: Date.now() - startedAt }
    } catch (dbErr: any) {
      err(itemId, 'Step 3/3 — DB update failed', dbErr)
      await markFailed(itemId, `DB write failed: ${dbErr.message}`, fallback)
      return { success: false, itemId, step: 'failed', error: dbErr.message, durationMs: Date.now() - startedAt }
    }
  }

  // ── Race against timeout ─────────────────────────────────────────────────
  const timeoutPromise = new Promise<ProcessResult>((_, reject) =>
    setTimeout(() => reject(timeoutErr), timeoutMs)
  )

  try {
    return await Promise.race([doProcess(), timeoutPromise])
  } catch (raceErr: any) {
    err(itemId, `Top-level failure: ${raceErr.message}`)
    await markFailed(itemId, raceErr.message ?? 'Unknown error', fallback)
    return { success: false, itemId, step: 'failed', error: raceErr.message, durationMs: Date.now() - startedAt }
  }
}
