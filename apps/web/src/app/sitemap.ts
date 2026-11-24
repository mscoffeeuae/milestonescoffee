import type { MetadataRoute } from 'next';
import { sanityFetch } from '@/lib/sanity/client';
import { BRANCHES_FALLBACK } from '@/lib/branches-fallback';

const BASE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://milestonescoffee.com';

interface SlimBranch {
  slug: string;
  _updatedAt: string;
}

/** Fetches branches for sitemap entries. */
const BRANCHES_SITEMAP_QUERY = `
  *[_type == "branch" && isActive == true] {
    "slug": slug.current,
    _updatedAt
  }
`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cmsBranches = await sanityFetch<SlimBranch[]>(BRANCHES_SITEMAP_QUERY);
  // Same fallback the branch pages use until the CMS has branches.
  const branches: SlimBranch[] =
    cmsBranches && cmsBranches.length > 0
      ? cmsBranches
      : BRANCHES_FALLBACK.map((b) => ({ slug: b.slug, _updatedAt: new Date().toISOString() }));

  const staticRoutes: MetadataRoute.Sitemap = [
    // Redirect root → /en handled by middleware; include canonical /en
    {
      url: `${BASE_URL}/en`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: { en: `${BASE_URL}/en`, ar: `${BASE_URL}/ar` },
      },
    },
    {
      url: `${BASE_URL}/en/menu`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: { en: `${BASE_URL}/en/menu`, ar: `${BASE_URL}/ar/menu` },
      },
    },
    {
      url: `${BASE_URL}/en/locations`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: { en: `${BASE_URL}/en/locations`, ar: `${BASE_URL}/ar/locations` },
      },
    },
    {
      url: `${BASE_URL}/en/corporate`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {
        languages: { en: `${BASE_URL}/en/corporate`, ar: `${BASE_URL}/ar/corporate` },
      },
    },
  ];

  const branchRoutes: MetadataRoute.Sitemap = branches.flatMap((b) => [
    {
      url: `${BASE_URL}/en/locations/${b.slug}`,
      lastModified: new Date(b._updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      alternates: {
        languages: {
          en: `${BASE_URL}/en/locations/${b.slug}`,
          ar: `${BASE_URL}/ar/locations/${b.slug}`,
        },
      },
    },
  ]);

  return [...staticRoutes, ...branchRoutes];
}
