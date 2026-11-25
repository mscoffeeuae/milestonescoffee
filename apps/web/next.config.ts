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

  // Allow Next.js <Image> to load from live brand site
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'milestonescoffee.ae',
        pathname: '/**',
      },
      // Sanity asset CDN (menu and branch photos)
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/images/**' },
    ],
  },

  // Admin menu image uploads go through a server action (5 MB image cap enforced in the action).
  // The proxy buffers request bodies (default 10 MB); the menu import accepts a 50 MB images ZIP.
  experimental: { serverActions: { bodySizeLimit: '6mb' }, proxyClientMaxBodySize: '60mb' },

  // Output standalone for Docker
  output: 'standalone',
};

export default nextConfig;
