import { createClient, type SanityClient } from '@sanity/client';
import { baseName, optimiseImage, type OptimisedImage } from './image-optimise';

/**
 * Sanity access for the admin menu manager. Server-only: SANITY_API_WRITE_TOKEN is read
 * from the process environment here and must never be imported from a client component.
 * Documents are written as plain published `menuProduct` docs, matching apps/studio's schema.
 */

// Mirror apps/studio/src/schemas/documents/menu-product.ts option lists.
export const ALLERGEN_OPTIONS = [
  { value: 'dairy', en: 'Dairy', ar: 'ألبان' },
  { value: 'gluten', en: 'Gluten', ar: 'غلوتين' },
  { value: 'eggs', en: 'Eggs', ar: 'بيض' },
  { value: 'tree-nuts', en: 'Tree nuts', ar: 'مكسرات' },
  { value: 'peanuts', en: 'Peanuts', ar: 'فول سوداني' },
  { value: 'soy', en: 'Soy', ar: 'صويا' },
  { value: 'sesame', en: 'Sesame', ar: 'سمسم' },
  { value: 'fish', en: 'Fish', ar: 'سمك' },
  { value: 'shellfish', en: 'Shellfish', ar: 'محار' },
  { value: 'sulphites', en: 'Sulphites', ar: 'كبريتيت' },
] as const;

export const DIETARY_OPTIONS = [
  { value: 'vegan', en: 'Vegan', ar: 'نباتي صرف' },
  { value: 'vegetarian', en: 'Vegetarian', ar: 'نباتي' },
  { value: 'halal', en: 'Halal', ar: 'حلال' },
  { value: 'gluten-free', en: 'Gluten-free', ar: 'خالٍ من الغلوتين' },
  { value: 'sugar-free', en: 'Sugar-free', ar: 'خالٍ من السكر' },
  { value: 'dairy-free', en: 'Dairy-free', ar: 'خالٍ من الألبان' },
] as const;

export interface AdminProduct {
  _id: string;
  nameEn: string;
  nameAr: string | null;
  slug: string | null;
  categoryId: string | null;
  categoryEn: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  displayPriceAed: number | null;
  allergens: string[] | null;
  dietaryFlags: string[] | null;
  isActive: boolean | null;
  isNew: boolean | null;
  isFeatured: boolean | null;
  sortOrder: number | null;
  imageUrl: string | null;
  imageFilename: string | null;
  imageThumbUrl: string | null;
  imageLqip: string | null;
  imageMeta: StoredImageMeta | null;
}

/** Stored on the document next to the image fields (see apps/studio imageOptimisation object). */
export interface StoredImageMeta {
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
  originalBytes: number;
  fullBytes: number;
  thumbBytes: number;
  avifBytes: number | null;
  keptOriginal: boolean;
  originalFilename: string | null;
  optimisedAt: string;
}

export interface AdminCategory {
  _id: string;
  nameEn: string;
  nameAr: string | null;
}

const projectId = () => process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
const dataset = () => process.env['NEXT_PUBLIC_SANITY_DATASET'] ?? 'production';

export function writeConfigured(): boolean {
  return Boolean(process.env['SANITY_API_WRITE_TOKEN'] && projectId());
}

function client(withToken: boolean): SanityClient | null {
  const id = projectId();
  if (!id) return null;
  const token = withToken ? process.env['SANITY_API_WRITE_TOKEN'] : undefined;
  if (withToken && !token) return null;
  return createClient({
    projectId: id,
    dataset: dataset(),
    apiVersion: '2024-01-01',
    useCdn: false,
    perspective: 'published',
    ...(token ? { token } : {}),
  });
}

const PRODUCT_FIELDS = `
  _id, nameEn, nameAr, "slug": slug.current,
  "categoryId": category._ref, "categoryEn": category->nameEn,
  descriptionEn, descriptionAr, displayPriceAed, allergens, dietaryFlags,
  isActive, isNew, isFeatured, sortOrder,
  "imageUrl": productImage.asset->url,
  "imageFilename": productImage.asset->originalFilename,
  "imageThumbUrl": productImageThumb.asset->url,
  "imageLqip": coalesce(productImageThumb.asset->metadata.lqip, productImage.asset->metadata.lqip),
  imageMeta
`;

export async function listProducts(): Promise<AdminProduct[]> {
  const c = client(false);
  if (!c) return [];
  try {
    return await c.fetch(`*[_type == "menuProduct"] | order(category->nameEn asc, sortOrder asc, nameEn asc) {${PRODUCT_FIELDS}}`);
  } catch (err) {
    console.error('[admin/menu] list failed', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  const c = client(false);
  if (!c) return null;
  try {
    return (await c.fetch(`*[_type == "menuProduct" && _id == $id][0]{${PRODUCT_FIELDS}}`, { id })) ?? null;
  } catch {
    return null;
  }
}

export async function listCategories(): Promise<AdminCategory[]> {
  const c = client(false);
  if (!c) return [];
  try {
    return await c.fetch(`*[_type == "menuCategory"] | order(sortOrder asc, nameEn asc){_id, nameEn, nameAr}`);
  } catch {
    return [];
  }
}

export interface ProductInput {
  nameEn: string;
  nameAr: string;
  categoryId: string;
  descriptionEn: string;
  descriptionAr: string;
  displayPriceAed: number | null;
  allergens: string[];
  dietaryFlags: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface ImageFile {
  bytes: Buffer;
  filename: string;
  contentType: string;
}

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';
}

function need(): SanityClient {
  const c = client(true);
  if (!c) throw new Error('write-not-configured');
  return c;
}

export interface UploadedImage {
  image: { _type: 'image'; asset: { _type: 'reference'; _ref: string } };
  thumb: { _type: 'image'; asset: { _type: 'reference'; _ref: string } };
  avif: { _type: 'file'; asset: { _type: 'reference'; _ref: string } } | null;
  meta: StoredImageMeta;
}

/** Optimise (throws ImageError for bad input) and upload full + thumbnail (+ AVIF when smaller). */
export async function uploadOptimised(c: SanityClient, f: ImageFile, maxBytes?: number): Promise<UploadedImage> {
  const o: OptimisedImage = await optimiseImage(f.bytes, maxBytes);
  const stem = baseName(f.filename);
  const ref = <T extends 'image' | 'file'>(type: T, id: string) => ({ _type: type, asset: { _type: 'reference' as const, _ref: id } });
  const full = await c.assets.upload('image', o.full, { filename: `${stem}.${o.fullExt}`, contentType: o.fullType });
  const thumb = await c.assets.upload('image', o.thumb, { filename: `${stem}-${o.thumbWidth}w.webp`, contentType: 'image/webp' });
  const avif = o.avif ? await c.assets.upload('file', o.avif, { filename: `${stem}.avif`, contentType: 'image/avif' }) : null;
  return {
    image: ref('image', full._id),
    thumb: ref('image', thumb._id),
    avif: avif ? ref('file', avif._id) : null,
    meta: {
      width: o.width,
      height: o.height,
      thumbWidth: o.thumbWidth,
      thumbHeight: o.thumbHeight,
      originalBytes: o.originalBytes,
      fullBytes: o.fullBytes,
      thumbBytes: o.thumbBytes,
      avifBytes: o.avifBytes,
      keptOriginal: o.keptOriginal,
      originalFilename: f.filename.split(/[\/]/).pop() ?? f.filename,
      optimisedAt: new Date().toISOString(),
    },
  };
}

/** Field set written to a document for a freshly uploaded image. */
function imageFields(u: UploadedImage) {
  return { productImage: u.image, productImageThumb: u.thumb, imageMeta: u.meta, ...(u.avif ? { productImageAvif: u.avif } : {}) };
}
const IMAGE_UNSET = ['productImage', 'productImageThumb', 'productImageAvif', 'imageMeta'];

/** Create (no id) or update (id). `image`: new file to upload; `removeImage`: clear the current one. */
export async function saveProduct(id: string | null, input: ProductInput, image: ImageFile | null, removeImage: boolean): Promise<string> {
  const c = need();
  const fields = {
    nameEn: input.nameEn,
    nameAr: input.nameAr,
    category: { _type: 'reference' as const, _ref: input.categoryId },
    descriptionEn: input.descriptionEn,
    descriptionAr: input.descriptionAr,
    allergens: input.allergens,
    dietaryFlags: input.dietaryFlags,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
    sortOrder: input.sortOrder,
    ...(input.displayPriceAed != null ? { displayPriceAed: input.displayPriceAed } : {}),
  };
  const uploaded = image ? await uploadOptimised(c, image) : null;

  if (!id) {
    const base = slugify(input.nameEn);
    const taken = await c.fetch<number>(`count(*[_type == "menuProduct" && slug.current == $s])`, { s: base });
    const slug = taken > 0 ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;
    const doc = await c.create({
      _type: 'menuProduct',
      ...fields,
      slug: { _type: 'slug', current: slug },
      isNew: false,
      ...(uploaded ? imageFields(uploaded) : {}),
    });
    return doc._id;
  }

  let patch = c.patch(id).set(fields);
  const unset: string[] = [];
  if (input.displayPriceAed == null) unset.push('displayPriceAed');
  if (uploaded) {
    patch = patch.set(imageFields(uploaded));
    if (!uploaded.avif) unset.push('productImageAvif');
  } else if (removeImage) unset.push(...IMAGE_UNSET);
  if (unset.length) patch = patch.unset(unset);
  await patch.commit();
  return id;
}

export async function setActive(id: string, active: boolean): Promise<void> {
  await need().patch(id).set({ isActive: active }).commit();
}

/** Removes the published document and any Studio draft of it. */
export async function deleteProduct(id: string): Promise<void> {
  await need().transaction().delete(id).delete(`drafts.${id}`).commit();
}

/**
 * Re-optimises the image already stored on a product. Returns 'skipped' when it was already
 * optimised (re-encoding lossy WebP again would only lose quality) or has no image.
 */
export async function reoptimiseProduct(id: string): Promise<'done' | 'skipped'> {
  const c = need();
  const p = await getProduct(id);
  if (!p || !p.imageUrl || p.imageMeta) return 'skipped';
  const res = await fetch(p.imageUrl, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  const bytes = Buffer.from(await res.arrayBuffer());
  // Existing assets may predate the 5 MB upload limit, so allow a larger source here.
  const uploaded = await uploadOptimised(c, { bytes, filename: p.imageFilename ?? p.slug ?? 'image', contentType: res.headers.get('content-type') ?? '' }, 25 * 1024 * 1024);
  let patch = c.patch(id).set(imageFields(uploaded));
  if (!uploaded.avif) patch = patch.unset(['productImageAvif']);
  await patch.commit();
  return 'done';
}

/** Ids of products that have an image, split by whether they are already optimised. */
export async function listImageStatus(): Promise<{ id: string; optimised: boolean }[]> {
  const c = client(false);
  if (!c) return [];
  const rows = await c.fetch<{ id: string; optimised: boolean }[]>(
    `*[_type == "menuProduct" && defined(productImage.asset)]{"id": _id, "optimised": defined(imageMeta.fullBytes)}`,
  );
  return rows;
}

/* ── Bulk operations (all in one Sanity transaction per call) ─────────────── */

export const BULK_MAX = 200;

export async function bulkSetActive(ids: string[], active: boolean): Promise<void> {
  const c = need();
  const tx = c.transaction();
  for (const id of ids) tx.patch(id, (p) => p.set({ isActive: active }));
  await tx.commit();
}

/** Removes the published documents and any Studio drafts. */
export async function bulkDelete(ids: string[]): Promise<void> {
  const c = need();
  const tx = c.transaction();
  for (const id of ids) tx.delete(id).delete(`drafts.${id}`);
  await tx.commit();
}

export interface PriceChange { id: string; name: string; from: number; to: number }

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Adds a fixed AED amount, or a percentage, to the display price of each item.
 * Items with no price, or whose new price would fall outside 0–10,000, are skipped.
 */
export async function bulkAdjustPrice(
  ids: string[],
  mode: 'fixed' | 'percent',
  amount: number,
): Promise<{ changed: PriceChange[]; skipped: number }> {
  const c = need();
  const rows = await c.fetch<{ _id: string; nameEn: string; displayPriceAed: number | null }[]>(
    `*[_type == "menuProduct" && _id in $ids]{_id, nameEn, displayPriceAed}`,
    { ids },
  );
  const changed: PriceChange[] = [];
  let skipped = ids.length - rows.length;
  for (const r of rows) {
    if (r.displayPriceAed == null) { skipped++; continue; }
    const to = round2(mode === 'fixed' ? r.displayPriceAed + amount : r.displayPriceAed * (1 + amount / 100));
    if (!Number.isFinite(to) || to < 0 || to > 10000) { skipped++; continue; }
    if (to !== r.displayPriceAed) changed.push({ id: r._id, name: r.nameEn, from: r.displayPriceAed, to });
  }
  if (changed.length > 0) {
    const tx = c.transaction();
    for (const ch of changed) tx.patch(ch.id, (p) => p.set({ displayPriceAed: ch.to }));
    await tx.commit();
  }
  return { changed, skipped };
}

/** id -> English name, for activity labels. Unknown ids are omitted. */
export async function productNames(ids: string[]): Promise<Record<string, string>> {
  const c = client(false);
  if (!c || ids.length === 0) return {};
  try {
    const rows = await c.fetch<{ _id: string; nameEn: string }[]>(`*[_type == "menuProduct" && _id in $ids]{_id, nameEn}`, { ids });
    return Object.fromEntries(rows.map((r) => [r._id, r.nameEn]));
  } catch {
    return {};
  }
}
