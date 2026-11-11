import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@milestones/contracts';
import { sanityFetch } from '@/lib/sanity/client';
import { BRANCH_BY_SLUG_QUERY, BRANCHES_QUERY } from '@/lib/sanity/queries';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

/** ─── Types ─────────────────────────────────────────────────────────── */
interface BranchDetail {
  _id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  emirate: string;
  addressEn: string | null;
  addressAr: string | null;
  googleMapsUrl: string | null;
  coordinates: { lat: number; lng: number } | null;
  openingHours: Record<string, string | boolean> | null;
  openingHoursNoteEn: string | null;
  openingHoursNoteAr: string | null;
  services: string[] | null;
  phone: string | null;
  heroImage: { asset: { url: string } } | null;
  galleryImages: Array<{ asset: { url: string } }> | null;
  seo: {
    titleEn: string | null;
    titleAr: string | null;
    descriptionEn: string | null;
    descriptionAr: string | null;
    noIndex: boolean | null;
  } | null;
}

interface SlimBranch {
  _id: string;
  slug: string;
}

const SUPPORTED_LOCALES: Locale[] = ['en', 'ar'];

/** ─── Static params ──────────────────────────────────────────────────── */
export async function generateStaticParams(): Promise<{ locale: string; slug: string }[]> {
  const branches = await sanityFetch<SlimBranch[]>(BRANCHES_QUERY);
  if (!branches) return [];
  return SUPPORTED_LOCALES.flatMap((locale) =>
    branches.map((b) => ({ locale, slug: b.slug })),
  );
}

/** ─── Metadata ───────────────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) return {};

  const branch = await sanityFetch<BranchDetail>(BRANCH_BY_SLUG_QUERY, { slug });
  if (!branch) return {};

  const isAr = locale === 'ar';
  const title = isAr ? (branch.seo?.titleAr ?? branch.nameAr) : (branch.seo?.titleEn ?? branch.nameEn);
  const description = isAr ? branch.seo?.descriptionAr : branch.seo?.descriptionEn;

  return {
    title,
    description: description ?? undefined,
    robots: branch.seo?.noIndex ? { index: false } : undefined,
    alternates: {
      languages: {
        en: `/en/locations/${slug}`,
        ar: `/ar/locations/${slug}`,
      },
    },
  };
}

/** ─── Page ───────────────────────────────────────────────────────────── */
export default async function BranchPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();

  const typedLocale = locale as Locale;
  const isAr = typedLocale === 'ar';

  const branch = await sanityFetch<BranchDetail>(BRANCH_BY_SLUG_QUERY, { slug });
  if (!branch) notFound();

  const name = isAr ? branch.nameAr : branch.nameEn;
  const address = isAr ? branch.addressAr : branch.addressEn;

  return (
    <>
      <SiteHeader locale={typedLocale} />
      <main id="main-content">
        {/* Hero */}
        {branch.heroImage?.asset.url ? (
          <div className="relative h-72 md:h-96 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branch.heroImage.asset.url}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-32 bg-[var(--color-brand-primary)]" />
        )}

        <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            <h1 className="text-3xl font-bold">{name}</h1>

            {/* Services */}
            {branch.services && branch.services.length > 0 && (
              <section aria-label={isAr ? 'الخدمات المتاحة' : 'Available services'}>
                <h2 className="text-lg font-semibold mb-3">
                  {isAr ? 'الخدمات المتاحة' : 'Services'}
                </h2>
                <ul className="flex flex-wrap gap-2" role="list">
                  {branch.services.map((svc) => (
                    <li
                      key={svc}
                      className="bg-[var(--color-surface-muted)] px-3 py-1 rounded-full text-sm"
                    >
                      {svc}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Gallery */}
            {branch.galleryImages && branch.galleryImages.length > 0 && (
              <section aria-label={isAr ? 'معرض الصور' : 'Gallery'}>
                <h2 className="text-lg font-semibold mb-3">
                  {isAr ? 'معرض الصور' : 'Gallery'}
                </h2>
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-2" role="list">
                  {branch.galleryImages.map((img, i) => (
                    <li key={i}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.asset.url}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-32 object-cover rounded"
                        loading="lazy"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Address */}
            {address && (
              <section>
                <h2 className="font-semibold mb-1">{isAr ? 'العنوان' : 'Address'}</h2>
                <address className="text-sm text-[var(--color-text-secondary)] not-italic">
                  {address}
                </address>
                {branch.googleMapsUrl && (
                  <a
                    href={branch.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm text-[var(--color-brand-primary)] underline underline-offset-2"
                  >
                    {isAr ? 'احصل على الاتجاهات' : 'Get directions'}
                  </a>
                )}
              </section>
            )}

            {/* Phone */}
            {branch.phone && (
              <section>
                <h2 className="font-semibold mb-1">{isAr ? 'الهاتف' : 'Phone'}</h2>
                <a
                  href={`tel:${branch.phone}`}
                  className="text-sm text-[var(--color-brand-primary)]"
                >
                  {branch.phone}
                </a>
              </section>
            )}

            {/* Opening hours note */}
            {(isAr ? branch.openingHoursNoteAr : branch.openingHoursNoteEn) && (
              <p className="text-xs text-[var(--color-text-secondary)] border-t pt-4">
                {isAr ? branch.openingHoursNoteAr : branch.openingHoursNoteEn}
              </p>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter locale={typedLocale} />
    </>
  );
}
