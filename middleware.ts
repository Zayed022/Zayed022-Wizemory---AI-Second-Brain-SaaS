import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/demo',
  '/demo/(.*)',
  '/vs',
  '/team',
  '/about',
  '/blog',
  '/blog/(.*)',
  '/changelog',
  '/privacy',
  '/terms',
  '/founder',
  '/tools/(.*)',
  '/share/(.*)',
  '/auth/(.*)',
  '/sitemap.xml',
  '/robots.txt',
  '/api/auth/webhook',
  '/api/billing/webhook',
  '/api/paddle/webhook',
  '/api/health',
])

const isSEORoute = createRouteMatcher([
  '/',
  '/pricing',
  '/demo',
  '/demo/(.*)',
  '/vs',
  '/team',
  '/about',
  '/blog',
  '/blog/(.*)',
  '/changelog',
  '/privacy',
  '/terms',
  '/founder',
  '/tools/(.*)',
  '/share/(.*)',
])

export default clerkMiddleware((auth, req) => {
  // Return early — Clerk won't touch these responses at all
  if (isSEORoute(req)) {
    return NextResponse.next()
  }

  if (!isPublicRoute(req)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)',
  ],
}