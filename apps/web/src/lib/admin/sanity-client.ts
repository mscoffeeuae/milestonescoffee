import { createClient, type SanityClient } from '@sanity/client';

/** Server-only Sanity clients for the admin. The write token never leaves the server. */
function make(token: string | undefined): SanityClient | null {
  const projectId = process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
  if (!projectId) return null;
  return createClient({
    projectId,
    dataset: process.env['NEXT_PUBLIC_SANITY_DATASET'] ?? 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    perspective: 'published',
    ...(token ? { token } : {}),
  });
}

export const readClient = (): SanityClient | null => make(undefined);

export function writeClient(): SanityClient | null {
  const token = process.env['SANITY_API_WRITE_TOKEN'];
  return token ? make(token) : null;
}
