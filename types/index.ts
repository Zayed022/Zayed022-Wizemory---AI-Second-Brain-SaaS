export type Plan          = 'FREE' | 'PRO' | 'TEAM' | 'BUSINESS'
export type ItemType      = 'ARTICLE' | 'NOTE' | 'VOICE' | 'PDF' | 'SCREENSHOT' | 'BOOKMARK' | 'YOUTUBE' | 'PODCAST'
export type ItemStatus    = 'PROCESSING' | 'READY' | 'FAILED'
export type ReminderStatus = 'PENDING' | 'SENT' | 'DISMISSED'

export interface User {
  id: string; clerkId: string; email: string; name: string | null
  avatarUrl: string | null; plan: Plan; itemCount: number
  streak: number; lastActiveAt: Date; referralCode: string | null
  referralCount: number; createdAt: Date
}

export interface Item {
  id: string; userId: string; type: ItemType; title: string
  url: string | null; domain: string | null; rawContent: string | null
  summary: string | null; keyInsights: string[]; tags: string[]
  readTime: number | null; fileKey: string | null; audioKey: string | null
  youtubeId: string | null; status: ItemStatus; isPublic: boolean
  publicSlug: string | null; viewCount: number; isFavorite: boolean
  reviewCount: number; nextReviewAt: Date | null; embedding: number[]
  createdAt: Date; updatedAt: Date
}

export interface Collection {
  id: string; userId: string; name: string; description: string | null
  emoji: string | null; color: string | null; isPublic: boolean
  itemCount: number; createdAt: Date; updatedAt: Date
}

export interface Highlight {
  id: string; userId: string; itemId: string; text: string
  note: string | null; color: string; position: number; createdAt: Date
}

export interface Connection {
  id: string; userId: string; title: string; description: string | null
  strength: number; items: Item[]; createdAt: Date
}

export interface WeeklyDigest {
  id: string; userId: string; content: string; weekStart: Date; sentAt: Date
}

export const PLAN_LIMITS = {
  FREE:     { items: 50,       aiQueries: 10       },
  PRO:      { items: Infinity, aiQueries: Infinity },
  TEAM:     { items: Infinity, aiQueries: Infinity },
  BUSINESS: { items: Infinity, aiQueries: Infinity },
} as const

export const PLAN_PRICES = {
  PRO:      { monthly: 12,  yearly: 99  },
  TEAM:     { monthly: 49,  yearly: 399 },
  BUSINESS: { monthly: 199, yearly: 1499 },
} as const
