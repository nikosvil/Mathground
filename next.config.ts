import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['three'],
  serverExternalPackages: ['@lancedb/lancedb', '@xenova/transformers', 'pdf-parse'],
  turbopack: {
    resolveAlias: {
      react: 'react',
      'react-dom': 'react-dom',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    }
    return config
  },
}

export default nextConfig
