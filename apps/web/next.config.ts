import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
    turbopack: {
      root: '/app',
    },
  },
};

export default nextConfig;
