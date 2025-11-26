import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: '../../',
  },
  transpilePackages: ['@repo/auth', '@repo/database', '@repo/types', '@repo/publishers'],
  serverExternalPackages: ['pg'],
};

export default nextConfig;
