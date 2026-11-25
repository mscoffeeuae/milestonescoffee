'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/guard';
import {
  ALLERGEN_OPTIONS,
  DIETARY_OPTIONS,
  deleteProduct,
  saveProduct,
  setActive,
  writeConfigured,
  type ImageFile,
  type ProductInput,
} from '@/lib/admin/menu-data';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Public pages that show menu data. */
function refreshPublic() {
  for (const p of ['/en/menu', '/ar/menu', '/en', '/ar']) revalidatePath(p);
}

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const pickAll = (f: FormData, k: string, allowed: readonly string[]) =>
  f.getAll(k).map(String).filter((v) => allowed.includes(v));

function fail(id: string | null, code: string): never {
  redirect(`${id ? `/admin/menu/${encodeURIComponent(id)}` : '/admin/menu/new'}?err=${code}`);
}

export async function saveProductAction(formData: FormData): Promise<void> {
  await requireAdmin(); // every write starts with the session check
  const id = str(formData, 'id') || null;
  if (!writeConfigured()) fail(id, 'config');

  const nameEn = str(formData, 'nameEn');
  const nameAr = str(formData, 'nameAr');
  const categoryId = str(formData, 'categoryId');
  const descriptionEn = str(formData, 'descriptionEn');
  const descriptionAr = str(formData, 'descriptionAr');
  const priceRaw = str(formData, 'price');
  const sortRaw = str(formData, 'sortOrder');

  if (nameEn.length < 2 || nameEn.length > 100 || nameAr.length < 2 || nameAr.length > 100) fail(id, 'name');
  if (!categoryId) fail(id, 'category');
  if (descriptionEn.length > 400 || descriptionAr.length > 400) fail(id, 'desc');

  let price: number | null = null;
  if (priceRaw !== '') {
    price = Number(priceRaw);
    if (!Number.isFinite(price) || price < 0 || price > 10000) fail(id, 'price');
  }
  const sortOrder = sortRaw === '' ? 100 : Number(sortRaw);
  if (!Number.isInteger(sortOrder) || sortOrder < 0) fail(id, 'sort');

  let image: ImageFile | null = null;
  const file = formData.get('image');
  if (file instanceof File && file.size > 0) {
    if (!IMAGE_TYPES.includes(file.type)) fail(id, 'imagetype');
    if (file.size > MAX_IMAGE_BYTES) fail(id, 'imagesize');
    image = { bytes: Buffer.from(await file.arrayBuffer()), filename: file.name, contentType: file.type };
  }

  const input: ProductInput = {
    nameEn,
    nameAr,
    categoryId,
    descriptionEn,
    descriptionAr,
    displayPriceAed: price,
    allergens: pickAll(formData, 'allergens', ALLERGEN_OPTIONS.map((o) => o.value)),
    dietaryFlags: pickAll(formData, 'dietaryFlags', DIETARY_OPTIONS.map((o) => o.value)),
    isActive: formData.get('isActive') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
    sortOrder,
  };

  try {
    await saveProduct(id, input, image, formData.get('removeImage') === 'on');
  } catch (err) {
    console.error('[admin/menu] save failed', err instanceof Error ? err.message : err);
    fail(id, 'save');
  }
  refreshPublic();
  redirect('/admin/menu?msg=saved');
}

export async function toggleActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, 'id');
  if (!id || !writeConfigured()) redirect('/admin/menu?msg=error');
  try {
    await setActive(id, formData.get('to') === '1');
  } catch (err) {
    console.error('[admin/menu] toggle failed', err instanceof Error ? err.message : err);
    redirect('/admin/menu?msg=error');
  }
  refreshPublic();
  redirect('/admin/menu?msg=updated');
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, 'id');
  if (!id || !writeConfigured()) redirect('/admin/menu?msg=error');
  try {
    await deleteProduct(id);
  } catch (err) {
    console.error('[admin/menu] delete failed', err instanceof Error ? err.message : err);
    redirect('/admin/menu?msg=error');
  }
  refreshPublic();
  redirect('/admin/menu?msg=deleted');
}
