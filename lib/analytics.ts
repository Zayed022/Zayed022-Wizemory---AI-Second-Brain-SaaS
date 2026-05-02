/**
 * lib/analytics.ts
 *
 * Thin wrapper around GA4 event tracking.
 * Call from any client component — safe when GA is not loaded.
 *
 * Usage:
 *   import { track } from '@/lib/analytics'
 *   track('item_created', { type: 'ARTICLE' })
 */

export function track(event: string, params?: Record<string, any>) {
  try {
    const w = window as any
    if (typeof w.trackEvent === 'function') {
      w.trackEvent(event, params)
    }
  } catch {
    // Silent — analytics should never break the app
  }
}

// ── Typed event helpers ───────────────────────────────────────────────────────

export const Analytics = {
  // Acquisition
  signupStarted:   ()                      => track('signup_started'),
  signupCompleted: (method: string)        => track('signup_completed',   { method }),

  // Activation
  firstItemSaved:  (type: string)          => track('first_item_saved',   { type }),
  itemCreated:     (type: string)          => track('item_created',       { type }),
  itemFailed:      (type: string)          => track('item_failed',        { type }),
  itemRetried:     ()                      => track('item_retry_clicked'),

  // Feature usage
  aiChatUsed:      ()                      => track('ai_chat_used'),
  graphViewed:     ()                      => track('graph_viewed'),
  agentRun:        (steps: number)         => track('agent_run',          { steps }),
  reviewCompleted: (count: number)         => track('review_completed',   { count }),
  exportTriggered: (format: string)        => track('export_triggered',   { format }),
  writeUsed:       (format: string)        => track('write_used',         { format }),

  // Revenue
  upgradeClicked:  (plan: string, location: string) => track('upgrade_clicked', { plan, location }),
  checkoutStarted: (plan: string)          => track('checkout_started',   { plan }),
  subscribed:      (plan: string)          => track('subscribed',         { plan }),

  // Retention
  digestOpened:    ()                      => track('digest_email_opened'),
  shareCardViewed: (itemId: string)        => track('share_card_viewed',  { item_id: itemId }),
  referralClicked: ()                      => track('referral_link_clicked'),
}
