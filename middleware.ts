import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - sitemap.xml   ← bypass Clerk entirely at matcher level
     * - robots.txt    ← bypass Clerk entirely at matcher level
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)',
  ],
}