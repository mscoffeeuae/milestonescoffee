/**
 * Sanity read-only client for apps/web.
 *
 * Uses the public (unauthenticated) API by default.
 * Token is never needed for published content in a public dataset.
 *
 * IMPORTANT: This module is imported only from Server Components / route handlers.
 * Never import it in a Client Component — it would expose the project ID to the bundle.
 */
import { createClient } from '@sanity/client';

/** Project-level constants — no secrets. */
const projectId = process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
const dataset = process.env['NEXT_PUBLIC_SANITY_DATASET'] ?? 'production';
const apiVersion = '2024-01-01';

if (!projectId) {
  // Log once at startup; individual fetch calls will return null/empty gracefully.
  console.warn('[milestones/web] NEXT_PUBLIC_SANITY_PROJECT_ID not configured — CMS content unavailable');
}

export const sanityClient = createClient({
  projectId: projectId ?? 'placeholder',
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
});

/** Typed fetch helper — returns null instead of throwing when CMS is not configured. */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T | null> {
  if (!projectId) return null;
  try {
    return await sanityClient.fetch<T>(query, params);
  } catch (err) {
    console.error('[sanityFetch] query failed', { query, err });
    return null;
  }
}
