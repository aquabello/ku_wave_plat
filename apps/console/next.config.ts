import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ku/types'],
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
