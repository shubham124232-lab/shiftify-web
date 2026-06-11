/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'https://midnightblue-gazelle-752413.hostingersite.com/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
