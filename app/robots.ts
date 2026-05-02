import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/api/', '/auth/'] },
    sitemap: 'https://wizemory.com/sitemap.xml',
    host: 'https://wizemory.com',
  }
}
