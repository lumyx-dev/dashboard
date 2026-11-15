import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image: no node_modules at runtime.
  output: 'standalone',
  transpilePackages: ['@lumyx/ui'],
};

export default nextConfig;
