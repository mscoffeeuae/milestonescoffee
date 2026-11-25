import { requireAdmin } from '@/lib/admin/guard';
import { getT } from '@/lib/admin/lang';
import { getProduct, listCategories } from '@/lib/admin/menu-data';
import { MenuForm } from '@/components/admin/menu-form';

export default async function EditMenuItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { err } = await searchParams;
  const { lang, t } = await getT();
  const [product, categories] = await Promise.all([getProduct(decodeURIComponent(id)), listCategories()]);
  return (
    <div className="space-y-[var(--spacing-lg)]">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('editItem')}</h1>
      {product ? (
        <MenuForm product={product} categories={categories} t={t} lang={lang} error={err} />
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">{t('notFound')}</p>
      )}
    </div>
  );
}
