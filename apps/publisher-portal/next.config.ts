import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg'],
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  } as any,
  productionBrowserSourceMaps: false,
}

export default nextConfig

