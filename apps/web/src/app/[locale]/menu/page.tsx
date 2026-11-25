import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@milestones/contracts';
import { getDict } from '@milestones/i18n';
import { sanityFetch } from '@/lib/sanity/client';
import { MENU_CATEGORIES_QUERY } from '@/lib/sanity/queries';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { MenuBrowser, type MenuCategory } from '@/components/menu/menu-browser';
import { DEMO_MENU, IS_DEV_PREVIEW } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

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
    alternates: { languages: { en: '/en/menu', ar: '/ar/menu' } },
  };
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();

  const typedLocale = locale as Locale;
  const isAr = typedLocale === 'ar';
  const cmsCategories = ((await sanityFetch<MenuCategory[]>(MENU_CATEGORIES_QUERY)) ?? []).filter(
    (c) => c.products?.length > 0,
  );
  const isDemo = IS_DEV_PREVIEW && cmsCategories.length === 0;
  const categories = isDemo ? DEMO_MENU : cmsCategories;
  const itemCount = categories.reduce((n, c) => n + c.products.length, 0);
  const newCount = categories.reduce((n, c) => n + c.products.filter((p) => p.isNew).length, 0);

  // schema.org Menu > MenuSection > MenuItem, names in the page language. Never emitted for dev demo data.
  const DIETS: Record<string, string> = {
    vegan: 'https://schema.org/VeganDiet',
    vegetarian: 'https://schema.org/VegetarianDiet',
    'gluten-free': 'https://schema.org/GlutenFreeDiet',
    halal: 'https://schema.org/HalalDiet',
  };
  const jsonLd = isDemo
    ? null
    : {
        '@context': 'https://schema.org',
        '@type': 'Menu',
        name: isAr ? 'قائمة ميلستونز كوفي' : 'Milestones Coffee Menu',
        inLanguage: typedLocale,
        hasMenuSection: categories.map((c) => ({
          '@type': 'MenuSection',
          name: (isAr && c.nameAr) || c.nameEn,
          ...((isAr ? c.descriptionAr || c.descriptionEn : c.descriptionEn) && {
            description: isAr ? c.descriptionAr || c.descriptionEn : c.descriptionEn,
          }),
          hasMenuItem: c.products.map((p) => {
            const desc = isAr ? p.descriptionAr || p.descriptionEn : p.descriptionEn;
            const diets = (p.dietaryFlags ?? []).map((f) => DIETS[f]).filter(Boolean);
            return {
              '@type': 'MenuItem',
              name: (isAr && p.nameAr) || p.nameEn,
              ...(desc && { description: desc }),
              ...(p.productImage?.asset?.url && { image: p.productImage.asset.url }),
              ...(diets.length > 0 && { suitableForDiet: diets }),
              ...(p.displayPriceAed != null && {
                offers: { '@type': 'Offer', price: p.displayPriceAed, priceCurrency: 'AED' },
              }),
            };
          }),
        })),
      };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // "<" escaped so CMS text can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      <SiteHeader locale={typedLocale} />
      <main id="main-content" className="min-h-screen bg-[var(--color-brand-ivory,#F5F0E8)]">
{isDemo && (
          <div role="note" className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-black">
            DEV PREVIEW — demo data shown because the CMS is empty. Never shown in production.
          </div>
        )}
        {/* Hero */}
        <section className="relative overflow-hidden bg-[var(--color-brand-espresso,#3B1F0E)] text-white">
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #C9A87C 0, transparent 40%), radial-gradient(circle at 85% 70%, #A0784A 0, transparent 35%)' }}
          />
          <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><ellipse cx='32' cy='32' rx='5' ry='8' transform='rotate(35 32 32)' fill='%23C9A87C' fill-opacity='0.12'/></svg>\")" }} />
          <div className="container relative mx-auto px-4 py-16 md:py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-gold,#C9A87C)]">
              Milestones Coffee
            </p>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold" style={{ color: "#fff" }}>
              {/* [PLACEHOLDER] — requires Marketing-approved copy */}
              {isAr ? 'قائمة الطعام' : 'Our Menu'}
            </h1>
            {categories.length > 0 && (
              <dl className="mt-8 flex flex-wrap gap-8">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/60">{isAr ? 'الأقسام' : 'Categories'}</dt>
                  <dd className="text-3xl font-bold text-[var(--color-brand-gold,#C9A87C)]">{categories.length}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/60">{isAr ? 'الأصناف' : 'Items'}</dt>
                  <dd className="text-3xl font-bold text-[var(--color-brand-gold,#C9A87C)]">{itemCount}</dd>
                </div>
                {newCount > 0 && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-white/60">{isAr ? 'جديد' : 'New'}</dt>
                    <dd className="text-3xl font-bold text-[var(--color-brand-gold,#C9A87C)]">{newCount}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </section>

        {categories.length > 0 ? (
          <MenuBrowser categories={categories} locale={typedLocale as 'en' | 'ar'} />
        ) : (
          <div className="container mx-auto px-4 text-center py-24" role="status">
            <p className="text-black/60">
              {isAr ? '[PLACEHOLDER] قائمة الطعام ستتوفر قريباً' : '[PLACEHOLDER] Menu content coming soon'}
            </p>
          </div>
        )}

        {/* Allergen disclaimer */}
        <div className="border-t border-amber-200 bg-amber-50">
          <div className="container mx-auto px-4 py-6">
            <p className="text-xs text-amber-900">
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
