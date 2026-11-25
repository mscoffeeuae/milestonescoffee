import { createClient, type SanityClient } from '@sanity/client';

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
  "imageUrl": productImage.asset->url
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

async function uploadImage(c: SanityClient, f: ImageFile) {
  const asset = await c.assets.upload('image', f.bytes, { filename: f.filename, contentType: f.contentType });
  return { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: asset._id } };
}

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
  const productImage = image ? await uploadImage(c, image) : null;

  if (!id) {
    const base = slugify(input.nameEn);
    const taken = await c.fetch<number>(`count(*[_type == "menuProduct" && slug.current == $s])`, { s: base });
    const slug = taken > 0 ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;
    const doc = await c.create({
      _type: 'menuProduct',
      ...fields,
      slug: { _type: 'slug', current: slug },
      isNew: false,
      ...(productImage ? { productImage } : {}),
    });
    return doc._id;
  }

  let patch = c.patch(id).set(fields);
  const unset: string[] = [];
  if (input.displayPriceAed == null) unset.push('displayPriceAed');
  if (productImage) patch = patch.set({ productImage });
  else if (removeImage) unset.push('productImage');
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
