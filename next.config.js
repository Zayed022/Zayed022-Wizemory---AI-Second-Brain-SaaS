/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'img.clerk.com',
      'images.clerk.dev',
      'wizemory-uploads.s3.amazonaws.com',
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
  // ✅ Removed the www redirect — handle this at DNS/Vercel level instead
}

module.exports = nextConfig