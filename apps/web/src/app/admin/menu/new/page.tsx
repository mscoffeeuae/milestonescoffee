import { requireAdmin } from '@/lib/admin/guard';
import { getT } from '@/lib/admin/lang';
import { listCategories } from '@/lib/admin/menu-data';
import { MenuForm } from '@/components/admin/menu-form';

export default async function NewMenuItemPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  await requireAdmin();
  const { err } = await searchParams;
  const { lang, t } = await getT();
  const categories = await listCategories();
  return (
    <div className="space-y-[var(--spacing-lg)]">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('addItem')}</h1>
      <MenuForm product={null} categories={categories} t={t} lang={lang} error={err} />
    </div>
  );
}
