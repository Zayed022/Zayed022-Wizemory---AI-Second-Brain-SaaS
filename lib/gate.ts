/**
 * lib/gate.ts
 *
 * Single source of truth for plan-based feature gating.
 *
 * Usage in any API route:
 *   const gate = planGate(user.plan)
 *   if (!gate.canUseAI)     return gate.denyResponse('ai_qa')
 *   if (!gate.canUseAgent)  return gate.denyResponse('agent')
 *   if (!gate.canExport)    return gate.denyResponse('export')
 *
 * Design:
 *   - All gating logic lives here — never scattered across routes
 *   - denyResponse() returns a typed NextResponse, ready to return directly
 *   - DEMO_USER_IDS is a server-only allowlist so demo never leaks into prod
 */

import { NextResponse } from 'next/server'
import type { Plan } from '@/types'

// ── Feature matrix ────────────────────────────────────────────────────────────

export interface PlanGate {
  plan:             Plan
  canUseAI:         boolean   // AI Q&A, AI chat
  canUseAgent:      boolean   // Agentic task runner (Pro+)
  canUseGraph:      boolean   // Knowledge graph (Pro+)
  canExport:        boolean   // ZIP / JSON export (Pro+)
  canUseWrite:      boolean   // AI writing assistant (Pro+)
  canUseConnections:boolean   // AI connection discovery (Pro+)
  canUseCoach:      boolean   // AI memory coach (Pro+)
  itemLimit:        number    // max saved items
  aiQueryLimit:     number    // monthly AI queries (Infinity = unlimited)
  denyResponse:     (feature: string) => NextResponse
}

const FREE_DENY = (feature: string) =>
  NextResponse.json(
    {
      error:   `${featureLabel(feature)} requires a Pro plan.`,
      upgrade: true,
      feature,
      cta:     'Upgrade to Pro — $12/month for unlimited everything.',
      url:     '/pricing',
    },
    { status: 403 }
  )

function featureLabel(f: string): string {
  const labels: Record<string, string> = {
    ai_qa:       'AI Q&A',
    agent:       'AI Agent',
    graph:       'Knowledge Graph',
    export:      'Knowledge Export',
    write:       'AI Writing Assistant',
    connections: 'AI Connection Discovery',
    coach:       'AI Memory Coach',
  }
  return labels[f] ?? f
}

export function planGate(plan: Plan): PlanGate {
  const isPro  = plan === 'PRO' || plan === 'TEAM' || plan === 'BUSINESS'
  const isTeam = plan === 'TEAM' || plan === 'BUSINESS'

  return {
    plan,
    canUseAI:          isPro,
    canUseAgent:       isPro,
    canUseGraph:       isPro,
    canExport:         isPro,
    canUseWrite:       isPro,
    canUseConnections: isPro,
    canUseCoach:       isPro,
    itemLimit:         isPro ? Infinity : 50,
    aiQueryLimit:      isPro ? Infinity : 10,
    denyResponse:      FREE_DENY,
  }
}

// ── AI query counter ──────────────────────────────────────────────────────────
// Tracks monthly AI usage for FREE plan enforcement.
// Uses a simple in-memory map keyed by userId + month.
// At scale: replace with Redis INCR. This is correct for current scale.

const aiCounters = new Map<string, number>()

function counterKey(userId: string): string {
  const month = new Date().toISOString().slice(0, 7) // "2025-04"
  return `${userId}:${month}`
}

export function incrementAiCount(userId: string): number {
  const key = counterKey(userId)
  const cur = aiCounters.get(key) ?? 0
  aiCounters.set(key, cur + 1)
  return cur + 1
}

export function getAiCount(userId: string): number {
  return aiCounters.get(counterKey(userId)) ?? 0
}

export const AI_QUERY_LIMIT_FREE = 10
