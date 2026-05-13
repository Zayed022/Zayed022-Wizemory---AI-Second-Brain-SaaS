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
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'wizemory.com' }],
        destination: 'https://www.wizemory.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig