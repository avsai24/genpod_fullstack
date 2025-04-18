/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',  // Don't proxy auth routes
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',  // Proxy all other API routes
      },
    ]
  },
}

module.exports = nextConfig 