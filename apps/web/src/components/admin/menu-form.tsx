import Link from 'next/link';
import { saveProductAction } from '@/app/admin/menu/actions';
import { ALLERGEN_OPTIONS, DIETARY_OPTIONS, type AdminCategory, type AdminProduct } from '@/lib/admin/menu-data';
import type { AdminLang, T } from '@/lib/admin/i18n';
import { Card } from './ui';

const input =
  'w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-base)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]';
const lbl = 'block text-sm';
const cap = 'mb-1 block text-[var(--color-text-secondary)]';

const ERR = {
  config: 'errConfig', name: 'errName', category: 'errCategory', desc: 'errDesc', price: 'errPrice',
  sort: 'errSort', imagetype: 'errImageType', imagesize: 'errImageSize', save: 'errSave',
} as const;

export function MenuForm({
  product, categories, t, lang, error,
}: { product: AdminProduct | null; categories: AdminCategory[]; t: T; lang: AdminLang; error?: string | undefined }) {
  const errKey = error && error in ERR ? ERR[error as keyof typeof ERR] : null;
  const has = (list: string[] | null | undefined, v: string) => Boolean(list?.includes(v));
  return (
    <Card>
      {errKey && <p role="alert" className="mb-4 text-sm text-[var(--color-error)]">{t(errKey)}</p>}
      {categories.length === 0 && <p role="alert" className="mb-4 text-sm text-[var(--color-warning)]">{t('noCategories')}</p>}
      <form action={saveProductAction} className="grid max-w-3xl gap-4 sm:grid-cols-2">
        {product && <input type="hidden" name="id" value={product._id} />}

        <label className={lbl}>
          <span className={cap}>{t('nameEn')}</span>
          <input name="nameEn" required minLength={2} maxLength={100} defaultValue={product?.nameEn ?? ''} className={input} />
        </label>
        <label className={lbl}>
          <span className={cap}>{t('nameAr')}</span>
          <input name="nameAr" required minLength={2} maxLength={100} dir="rtl" lang="ar" defaultValue={product?.nameAr ?? ''} className={input} />
        </label>

        <label className={lbl}>
          <span className={cap}>{t('category')}</span>
          <select name="categoryId" required defaultValue={product?.categoryId ?? ''} className={input}>
            <option value="" disabled>—</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{lang === 'ar' && c.nameAr ? c.nameAr : c.nameEn}</option>
            ))}
          </select>
        </label>
        <label className={lbl}>
          <span className={cap}>{t('priceAed')}</span>
          <input name="price" type="number" inputMode="decimal" min={0} max={10000} step="0.01" defaultValue={product?.displayPriceAed ?? ''} className={input} />
        </label>

        <label className={lbl}>
          <span className={cap}>{t('descEn')}</span>
          <textarea name="descriptionEn" rows={3} maxLength={400} defaultValue={product?.descriptionEn ?? ''} className={input} />
        </label>
        <label className={lbl}>
          <span className={cap}>{t('descAr')}</span>
          <textarea name="descriptionAr" rows={3} maxLength={400} dir="rtl" lang="ar" defaultValue={product?.descriptionAr ?? ''} className={input} />
        </label>

        <fieldset className="sm:col-span-2">
          <legend className={`${cap} text-sm`}>{t('dietary')}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {DIETARY_OPTIONS.map((o) => (
              <label key={o.value} className="inline-flex items-center gap-2">
                <input type="checkbox" name="dietaryFlags" value={o.value} defaultChecked={has(product?.dietaryFlags, o.value)} />
                {o[lang]}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="sm:col-span-2">
          <legend className={`${cap} text-sm`}>{t('allergens')}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {ALLERGEN_OPTIONS.map((o) => (
              <label key={o.value} className="inline-flex items-center gap-2">
                <input type="checkbox" name="allergens" value={o.value} defaultChecked={has(product?.allergens, o.value)} />
                {o[lang]}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--color-warning)]">{t('allergenWarn')}</p>
        </fieldset>

        <label className={lbl}>
          <span className={cap}>{t('sortOrder')}</span>
          <input name="sortOrder" type="number" min={0} step={1} defaultValue={product?.sortOrder ?? 100} className={input} />
        </label>
        <div className="flex flex-col justify-end gap-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? false} /> {t('visible')}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured ?? false} /> {t('featured')}
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className={lbl}>
            <span className={cap}>{t('image')}</span>
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
          </label>
          {product?.imageUrl && (
            <div className="mt-2 flex items-center gap-3 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${product.imageUrl}?w=160&h=160&fit=crop`} alt="" width={80} height={80} className="size-20 rounded-[var(--radius-md)] object-cover" />
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="removeImage" /> {t('removeImage')}
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="rounded-[var(--radius-md)] bg-[var(--color-interactive)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-interactive-hover)]">
            {t('save')}
          </button>
          <Link href="/admin/menu" className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-5 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]">
            {t('cancel')}
          </Link>
        </div>
      </form>
    </Card>
  );
}
