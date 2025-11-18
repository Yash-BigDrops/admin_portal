import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: '../../',
  },
  transpilePackages: ['@repo/publishers', '@repo/database', '@repo/rate-limit'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    unoptimized: true, 
  },
};

export default nextConfig;

