import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  // Marketing pages
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

  // Public share cards
  '/share/(.*)',

  // Auth
  '/auth/(.*)',

  // Public API webhooks — must NOT require auth
  '/api/auth/webhook',
  '/api/billing/webhook',
  '/api/paddle/webhook',

  // Public health check
  '/api/health',
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}