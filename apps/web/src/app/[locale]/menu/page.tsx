import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@milestones/contracts';
import { getDict } from '@milestones/i18n';
import { sanityFetch } from '@/lib/sanity/client';
import { MENU_CATEGORIES_QUERY } from '@/lib/sanity/queries';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

/** ─── Types ─────────────────────────────────────────────────────────── */
interface MenuProduct {
  _id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  displayPriceAed: number | null;
  allergens: string[] | null;
  dietaryFlags: string[] | null;
  isNew: boolean;
  isFeatured: boolean;
  productImage: { asset: { url: string } } | null;
}

interface MenuCategory {
  _id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  products: MenuProduct[];
}

/** ─── Metadata ───────────────────────────────────────────────────────── */
const SUPPORTED_LOCALES: Locale[] = ['en', 'ar'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) return {};
  const dict = getDict(locale as Locale);
  return {
    title: dict.nav.menu,
    alternates: {
      languages: { en: '/en/menu', ar: '/ar/menu' },
    },
  };
}

/** ─── Page ───────────────────────────────────────────────────────────── */
export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();

  const typedLocale = locale as Locale;
  const isAr = typedLocale === 'ar';
  const categories = await sanityFetch<MenuCategory[]>(MENU_CATEGORIES_QUERY);

  return (
    <>
      <SiteHeader locale={typedLocale} />
      <main id="main-content" className="min-h-screen">
        {/* Page header */}
        <div className="bg-[var(--color-brand-primary)] text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold">
              {/* [PLACEHOLDER] — requires Marketing-approved copy */}
              {isAr ? 'قائمة الطعام' : 'Our Menu'}
            </h1>
          </div>
        </div>

        {/* Category nav anchors */}
        {categories && categories.length > 0 && (
          <nav aria-label={isAr ? 'تصفح القائمة' : 'Browse menu'} className="sticky top-0 z-10 bg-white border-b shadow-sm">
            <div className="container mx-auto px-4 overflow-x-auto">
              <ul className="flex gap-6 py-3 whitespace-nowrap" role="list">
                {categories.map((cat) => (
                  <li key={cat._id}>
                    <a
                      href={`#${cat.slug}`}
                      className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-colors"
                    >
                      {isAr ? cat.nameAr : cat.nameEn}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}

        {/* Categories + products */}
        <div className="container mx-auto px-4 py-12 space-y-16">
          {categories && categories.length > 0 ? (
            categories.map((category) => (
              <section key={category._id} id={category.slug} aria-labelledby={`cat-${category._id}`}>
                <h2 id={`cat-${category._id}`} className="text-2xl font-bold mb-2">
                  {isAr ? category.nameAr : category.nameEn}
                </h2>
                {(isAr ? category.descriptionAr : category.descriptionEn) && (
                  <p className="text-[var(--color-text-secondary)] mb-8">
                    {isAr ? category.descriptionAr : category.descriptionEn}
                  </p>
                )}

                <ul
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  role="list"
                  aria-label={isAr ? category.nameAr : category.nameEn}
                >
                  {category.products.map((product) => (
                    <li key={product._id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                      {/* Product image */}
                      {product.productImage?.asset.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.productImage.asset.url}
                          alt={isAr ? product.nameAr : product.nameEn}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold">
                            {isAr ? product.nameAr : product.nameEn}
                          </h3>
                          {product.isNew && (
                            <span className="shrink-0 text-xs bg-[var(--color-brand-primary)] text-white px-2 py-0.5 rounded-full">
                              {isAr ? 'جديد' : 'New'}
                            </span>
                          )}
                        </div>

                        {(isAr ? product.descriptionAr : product.descriptionEn) && (
                          <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                            {isAr ? product.descriptionAr : product.descriptionEn}
                          </p>
                        )}

                        {/* Price — display only */}
                        {product.displayPriceAed != null && (
                          <p className="mt-3 font-medium text-[var(--color-brand-primary)]">
                            {isAr
                              ? `من ${product.displayPriceAed} درهم`
                              : `From AED ${product.displayPriceAed}`}
                          </p>
                        )}

                        {/* Dietary flags */}
                        {product.dietaryFlags && product.dietaryFlags.length > 0 && (
                          <ul className="flex flex-wrap gap-1 mt-2" role="list">
                            {product.dietaryFlags.map((flag) => (
                              <li
                                key={flag}
                                className="text-xs border border-current px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]"
                              >
                                {flag}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Allergens note */}
                        {product.allergens && product.allergens.length > 0 && (
                          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                            {isAr
                              ? `يحتوي على: ${product.allergens.join('، ')}`
                              : `Contains: ${product.allergens.join(', ')}`}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ) : (
            /* Empty state — CMS not yet populated */
            <div className="text-center py-24" role="status">
              <p className="text-[var(--color-text-secondary)]">
                {isAr ? '[PLACEHOLDER] قائمة الطعام ستتوفر قريباً' : '[PLACEHOLDER] Menu content coming soon'}
              </p>
            </div>
          )}
        </div>

        {/* Allergen disclaimer */}
        <div className="bg-[var(--color-surface-muted)] border-t">
          <div className="container mx-auto px-4 py-6">
            <p className="text-xs text-[var(--color-text-secondary)]">
              {/* [PLACEHOLDER] — allergen disclaimer copy requires Legal review */}
              {isAr
                ? '⚠ [PLACEHOLDER] إشعار المواد المسببة للحساسية — يتطلب مراجعة قانونية'
                : '⚠ [PLACEHOLDER] Allergen disclaimer — requires Legal review before publish'}
            </p>
          </div>
        </div>
      </main>
      <SiteFooter locale={typedLocale} />
    </>
  );
}
