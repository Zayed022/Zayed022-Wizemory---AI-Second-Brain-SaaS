/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'img.clerk.com',
      'images.clerk.dev',
      'memora-uploads.s3.amazonaws.com',
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
}

module.exports = nextConfig
