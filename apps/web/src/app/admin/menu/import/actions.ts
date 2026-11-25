'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logActivity } from '@/lib/admin/activity';
import { requireAdmin } from '@/lib/admin/guard';
import { listCategories, listProducts, writeConfigured } from '@/lib/admin/menu-data';
import { applyPlan, buildPlan } from '@/lib/admin/menu-import';
import { claim, discard, load, saveSummary, validToken } from '@/lib/admin/menu-import-store';

/** Step 2: re-parse the staged files server-side and write the valid rows. */
export async function confirmImportAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const token = String(formData.get('t') ?? '');
  if (!validToken(token)) redirect('/admin/menu/import?err=expired');
  if (!writeConfigured()) redirect(`/admin/menu/import?t=${token}&err=config`);
  if (!(await claim(token))) redirect(`/admin/menu/import?t=${token}&done=1`); // already confirmed

  const staged = await load(token);
  if (!staged) redirect('/admin/menu/import?err=expired');

  const [products, categories] = await Promise.all([listProducts(), listCategories()]);
  const plan = await buildPlan(staged.sheet, staged.ext, staged.zip, products, categories);
  if (plan.fatal) {
    await discard(token);
    redirect('/admin/menu/import?err=invalid');
  }
  const summary = await applyPlan(plan);
  await saveSummary(token, summary);
  await logActivity({
    action: 'import',
    entityType: 'import',
    label: `${summary.created + summary.updated} items imported`,
    detail: `created ${summary.created}, updated ${summary.updated}, unchanged ${summary.unchanged}, skipped (errors) ${summary.skippedInvalid}, failed ${summary.failed}`,
  });
  for (const p of ['/en/menu', '/ar/menu', '/en', '/ar']) revalidatePath(p);
  redirect(`/admin/menu/import?t=${token}&done=1`);
}

export async function cancelImportAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await discard(String(formData.get('t') ?? ''));
  redirect('/admin/menu/import');
}
