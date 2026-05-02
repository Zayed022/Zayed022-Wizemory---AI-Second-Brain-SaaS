import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'
import './globals.css'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://wizemory.com'),
  title: { default: 'WizeMory — Your AI Second Brain', template: '%s | WizeMory' },
  description: 'Your knowledge, connected. WizeMory saves anything, summarises automatically with AI, and lets you ask questions from your own knowledge base.',
  keywords: ['second brain', 'knowledge management', 'AI notes', 'personal knowledge base', 'read later', 'Notion alternative'],
  openGraph: {
    type: 'website', siteName: 'WizeMory',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', creator: '@wizemory' },
  manifest: '/manifest.json',
  icons: {
    icon:  [{ url: '/favicon.ico' }, { url: '/icon-192.png', sizes: '192x192' }],
    apple: [{ url: '/apple-icon.png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet" />

          {/* Google Analytics 4 — only loads when GA_ID is set */}
          {GA_ID && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
              />
              <Script id="ga4-init" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', {
                    page_path: window.location.pathname,
                    send_page_view: true,
                  });
                  // Expose a helper for event tracking from client components
                  window.trackEvent = function(eventName, params) {
                    if (typeof gtag !== 'undefined') {
                      gtag('event', eventName, params || {});
                    }
                  };
                `}
              </Script>
            </>
          )}
        </head>
        <body className="antialiased">
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1714',
                color: '#f7f6f2',
                border: '1px solid #47413a',
                borderRadius: '10px',
                fontSize: '13px',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
