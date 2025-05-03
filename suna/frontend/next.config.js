/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure URL rewrites to proxy API requests
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'http://backend:8000/api/:path*' // This is used inside Docker
          : 'http://localhost:8001/api/:path*', // This is for local development
      },
    ];
  },
};

module.exports = nextConfig;