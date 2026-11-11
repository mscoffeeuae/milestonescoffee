import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@milestones/ui',
    '@milestones/contracts',
    '@milestones/i18n',
    '@milestones/utilities',
    '@milestones/config',
  ],
  output: 'standalone',
};

export default nextConfig;
