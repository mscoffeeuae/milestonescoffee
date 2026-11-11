import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Bilingual routing uses App Router folder-based routing ([locale]/page.tsx)
  // i18n config omitted intentionally — not using Next.js pages i18n routing

  // Security headers — basic set; hardened in Prompt 5 (auth)
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],

  // Transpile shared workspace packages
  transpilePackages: [
    '@milestones/ui',
    '@milestones/contracts',
    '@milestones/i18n',
    '@milestones/utilities',
    '@milestones/config',
  ],

  // Output standalone for Docker
  output: 'standalone',
};

export default nextConfig;
