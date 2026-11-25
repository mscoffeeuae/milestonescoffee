'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logActivity } from '@/lib/admin/activity';
import { requireAdmin } from '@/lib/admin/guard';
import { addGalleryImages, MAX_GALLERY, removeGalleryImage } from '@/lib/admin/branch-gallery-data';
import { ImageError, MAX_INPUT_BYTES, validateImage } from '@/lib/admin/image-optimise';
import { writeConfigured } from '@/lib/admin/menu-data';

const MAX_FILES_PER_UPLOAD = MAX_GALLERY;

function back(id: string, qs: string): never {
  redirect(`/admin/branches/${encodeURIComponent(id)}/gallery?${qs}`);
}
const refresh = (slugless = true) => {
  if (slugless) for (const p of ['/en/locations', '/ar/locations']) revalidatePath(p);
  revalidatePath('/[locale]/locations/[slug]', 'page');
};

export async function addGalleryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/admin/branches');
  if (!writeConfigured()) back(id, 'err=config');

  const files = formData.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) back(id, 'err=nofile');
  if (files.length > MAX_FILES_PER_UPLOAD) back(id, 'err=full');

  const prepared: { bytes: Buffer; filename: string; contentType: string }[] = [];
  for (const f of files) {
    if (f.size > MAX_INPUT_BYTES) back(id, 'err=imagesize');
    const bytes = Buffer.from(await f.arrayBuffer());
    try {
      await validateImage(bytes);
    } catch (err) {
      back(id, `err=${err instanceof ImageError ? (err.code === 'size' ? 'imagesize' : err.code === 'decode' ? 'imagedecode' : 'imagetype') : 'save'}`);
    }
    prepared.push({ bytes, filename: f.name, contentType: f.type });
  }
  try {
    await addGalleryImages(id, prepared);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    console.error('[admin/gallery] add failed', msg);
    back(id, `err=${msg === 'gallery-full' ? 'full' : err instanceof ImageError ? 'imagetype' : 'save'}`);
  }
  await logActivity({ action: 'edit', entityType: 'branch', entityId: id, label: id, detail: `${prepared.length} gallery photo(s) added` });
  refresh();
  back(id, 'msg=added');
}

export async function removeGalleryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const key = String(formData.get('key') ?? '');
  if (!id || !key) redirect('/admin/branches');
  if (!writeConfigured()) back(id, 'err=config');
  try {
    await removeGalleryImage(id, key);
  } catch (err) {
    console.error('[admin/gallery] remove failed', err instanceof Error ? err.message : err);
    back(id, 'err=save');
  }
  await logActivity({ action: 'edit', entityType: 'branch', entityId: id, label: id, detail: 'gallery photo removed' });
  refresh();
  back(id, 'msg=removed');
}
