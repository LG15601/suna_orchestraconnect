/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["geist"],
  // Specify the source directory for the app
  distDir: '.next',
  // Disable ESLint during build to avoid errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure URL rewrites to proxy API requests
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'http://backend:8000/api/:path*' // This is used inside Docker
          : 'http://localhost:8002/api/:path*', // This is for local development
      },
    ];
  },
};

module.exports = nextConfig;