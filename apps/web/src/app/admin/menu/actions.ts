'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/guard';
import { ImageError, validateImage } from '@/lib/admin/image-optimise';
import { logActivity } from '@/lib/admin/activity';
import {
  ALLERGEN_OPTIONS,
  BULK_MAX,
  DIETARY_OPTIONS,
  bulkAdjustPrice,
  bulkDelete,
  bulkSetActive,
  deleteProduct,
  getProduct,
  productNames,
  saveProduct,
  setActive,
  writeConfigured,
  type ImageFile,
  type ProductInput,
} from '@/lib/admin/menu-data';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const imageCode = (err: unknown) => (err instanceof ImageError ? (err.code === 'size' ? 'imagesize' : err.code === 'decode' ? 'imagedecode' : 'imagetype') : 'save');

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
    if (file.size > MAX_IMAGE_BYTES) fail(id, 'imagesize');
    // The real type comes from the file contents, not the extension or declared MIME type.
    image = { bytes: Buffer.from(await file.arrayBuffer()), filename: file.name, contentType: file.type };
    try {
      await validateImage(image.bytes);
    } catch (err) {
      fail(id, imageCode(err));
    }
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

  let savedId = id ?? '';
  try {
    savedId = await saveProduct(id, input, image, formData.get('removeImage') === 'on');
  } catch (err) {
    console.error('[admin/menu] save failed', err instanceof Error ? err.message : err);
    fail(id, imageCode(err));
  }
  await logActivity({
    action: id ? 'edit' : 'create',
    entityType: 'menu',
    entityId: savedId,
    label: nameEn,
    detail: [image ? 'image uploaded' : '', formData.get('removeImage') === 'on' ? 'image removed' : '', input.isActive ? 'visible' : 'hidden'].filter(Boolean).join(', '),
  });
  refreshPublic();
  redirect('/admin/menu?msg=saved');
}

export async function toggleActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, 'id');
  if (!id || !writeConfigured()) redirect('/admin/menu?msg=error');
  const makeActive = formData.get('to') === '1';
  const before = await getProduct(id);
  try {
    await setActive(id, makeActive);
  } catch (err) {
    console.error('[admin/menu] toggle failed', err instanceof Error ? err.message : err);
    redirect('/admin/menu?msg=error');
  }
  await logActivity({ action: makeActive ? 'show' : 'hide', entityType: 'menu', entityId: id, label: before?.nameEn ?? id });
  refreshPublic();
  redirect('/admin/menu?msg=updated');
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, 'id');
  if (!id || !writeConfigured()) redirect('/admin/menu?msg=error');
  const doomed = await getProduct(id);
  try {
    await deleteProduct(id);
  } catch (err) {
    console.error('[admin/menu] delete failed', err instanceof Error ? err.message : err);
    redirect('/admin/menu?msg=error');
  }
  await logActivity({ action: 'delete', entityType: 'menu', entityId: id, label: doomed?.nameEn ?? id });
  refreshPublic();
  redirect('/admin/menu?msg=deleted');
}

const list = (names: string[], max = 8) => names.slice(0, max).join(', ') + (names.length > max ? ` (+${names.length - max} more)` : '');

/** Bulk show / hide / delete / price change on the items ticked in the menu table. */
export async function bulkAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const op = str(formData, 'op');
  const ids = [...new Set(formData.getAll('ids').map(String))].filter((v) => /^[\w.-]{1,128}$/.test(v));
  const back = (qs: string): never => redirect(`/admin/menu?${qs}`);
  if (!['show', 'hide', 'price', 'delete'].includes(op)) redirect('/admin/menu'); // e.g. Enter pressed inside an input

  if (!writeConfigured()) back('msg=error');
  if (ids.length === 0) back('msg=bulknone');
  if (ids.length > BULK_MAX) back('msg=bulkmany');
  const names = await productNames(ids);
  const labelFor = (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`;
  const nameList = ids.map((i) => names[i] ?? i);

  try {
    if (op === 'show' || op === 'hide') {
      await bulkSetActive(ids, op === 'show');
      await logActivity({ action: op, entityType: 'menu', label: labelFor(ids.length), detail: list(nameList) });
      refreshPublic();
      back(`msg=bulk&n=${ids.length}&s=0`);
    }
    if (op === 'delete') {
      if (formData.get('confirmDelete') !== 'on') back('msg=bulkconfirm');
      await bulkDelete(ids);
      await logActivity({ action: 'delete', entityType: 'menu', label: labelFor(ids.length), detail: list(nameList) });
      refreshPublic();
      back(`msg=bulk&n=${ids.length}&s=0`);
    }
    if (op === 'price') {
      const mode = str(formData, 'mode') === 'percent' ? 'percent' : 'fixed';
      const amount = Number(str(formData, 'amount'));
      if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > (mode === 'percent' ? 500 : 10000)) back('msg=bulkamount');
      const { changed, skipped } = await bulkAdjustPrice(ids, mode, amount);
      if (changed.length > 0) {
        await logActivity({
          action: 'price',
          entityType: 'menu',
          label: labelFor(changed.length),
          detail: `${amount > 0 ? '+' : ''}${amount}${mode === 'percent' ? '%' : ' AED'}: ${list(changed.map((c) => `${c.name} ${c.from}→${c.to}`), 10)}`,
        });
        refreshPublic();
      }
      back(`msg=bulk&n=${changed.length}&s=${skipped}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
    if (typeof err === 'object' && err !== null && 'digest' in err) throw err; // Next redirect
    console.error('[admin/menu] bulk failed', err instanceof Error ? err.message : err);
    back('msg=error');
  }
  back('msg=error');
}

