import { createClient, type SanityClient } from '@sanity/client';
import { uploadOptimised, writeConfigured, type StoredImageMeta } from './menu-data';

/** Branch gallery images (branch.galleryImages[]). Server-only, same write token as the menu. */

export const MAX_GALLERY = 10; // matches the Studio schema validation

export interface GalleryItem {
  key: string;
  url: string;
  thumbUrl: string | null;
  lqip: string | null;
  width: number | null;
  height: number | null;
  meta: StoredImageMeta | null;
}

export interface GalleryBranch {
  id: string;
  nameEn: string;
  nameAr: string | null;
  items: GalleryItem[];
}

function client(token: boolean): SanityClient | null {
  const projectId = process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
  if (!projectId) return null;
  const t = token ? process.env['SANITY_API_WRITE_TOKEN'] : undefined;
  if (token && !t) return null;
  return createClient({
    projectId,
    dataset: process.env['NEXT_PUBLIC_SANITY_DATASET'] ?? 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    perspective: 'published',
    ...(t ? { token: t } : {}),
  });
}

export async function getGalleryBranch(id: string): Promise<GalleryBranch | null> {
  const c = client(false);
  if (!c) return null;
  try {
    const row = await c.fetch<{ _id: string; nameEn: string; nameAr: string | null; items: Array<{
      key: string; url: string | null; thumbUrl: string | null; lqip: string | null; width: number | null; height: number | null; meta: StoredImageMeta | null;
    }> | null } | null>(
      `*[_type == "branch" && _id == $id][0]{
        _id, nameEn, nameAr,
        "items": galleryImages[defined(asset)]{
          "key": _key, "url": asset->url, "thumbUrl": thumb.asset->url,
          "lqip": asset->metadata.lqip,
          "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height,
          "meta": imageMeta
        }
      }`,
      { id },
    );
    if (!row) return null;
    return {
      id: row._id,
      nameEn: row.nameEn,
      nameAr: row.nameAr,
      items: (row.items ?? []).flatMap((i) => (i.url ? [{ ...i, url: i.url }] : [])),
    };
  } catch {
    return null;
  }
}

const key = () => Math.random().toString(36).slice(2, 12);

/** Optimises and appends photos. Throws ImageError for bad files; nothing is added unless all are valid. */
export async function addGalleryImages(
  id: string,
  files: { bytes: Buffer; filename: string; contentType: string }[],
): Promise<number> {
  const c = client(true);
  if (!c || !writeConfigured()) throw new Error('write-not-configured');
  const existing = await c.fetch<number>(`count(*[_type == "branch" && _id == $id][0].galleryImages)`, { id });
  if (existing + files.length > MAX_GALLERY) throw new Error('gallery-full');

  const items = [];
  for (const f of files) {
    const u = await uploadOptimised(c, f);
    items.push({ ...u.image, _key: key(), thumb: u.thumb, imageMeta: u.meta, ...(u.avif ? { avif: u.avif } : {}) });
  }
  await c.patch(id).setIfMissing({ galleryImages: [] }).append('galleryImages', items).commit();
  return items.length;
}

export async function removeGalleryImage(id: string, itemKey: string): Promise<void> {
  const c = client(true);
  if (!c) throw new Error('write-not-configured');
  if (!/^[\w-]{1,64}$/.test(itemKey)) throw new Error('bad-key');
  await c.patch(id).unset([`galleryImages[_key=="${itemKey}"]`]).commit();
}
