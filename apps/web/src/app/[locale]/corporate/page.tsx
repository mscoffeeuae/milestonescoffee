import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@milestones/contracts';
import { sanityFetch } from '@/lib/sanity/client';
import { CORPORATE_PAGE_QUERY } from '@/lib/sanity/queries';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

/** ─── Types ─────────────────────────────────────────────────────────── */
interface CorporatePageData {
  heroTitleEn: string | null;
  heroTitleAr: string | null;
  heroSubtitleEn: string | null;
  heroSubtitleAr: string | null;
  heroImage: { asset: { url: string } } | null;
  serviceCards: Array<{
    titleEn: string | null;
    titleAr: string | null;
    descriptionEn: string | null;
    descriptionAr: string | null;
    icon: string | null;
  }> | null;
  ctaLabelEn: string | null;
  ctaLabelAr: string | null;
  enquiryEmail: string | null;
  seo: {
    titleEn: string | null;
    titleAr: string | null;
    descriptionEn: string | null;
    descriptionAr: string | null;
    noIndex: boolean | null;
  } | null;
}

const SUPPORTED_LOCALES: Locale[] = ['en', 'ar'];

/** ─── Metadata ───────────────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) return {};

  const data = await sanityFetch<CorporatePageData>(CORPORATE_PAGE_QUERY);
  const isAr = locale === 'ar';

  return {
    title: (isAr ? data?.seo?.titleAr : data?.seo?.titleEn) ?? 'Corporate',
    description: (isAr ? data?.seo?.descriptionAr : data?.seo?.descriptionEn) ?? undefined,
    robots: data?.seo?.noIndex ? { index: false } : undefined,
    alternates: {
      languages: { en: '/en/corporate', ar: '/ar/corporate' },
    },
  };
}

/** ─── Page ───────────────────────────────────────────────────────────── */
export default async function CorporatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();

  const typedLocale = locale as Locale;
  const isAr = typedLocale === 'ar';

  const data = await sanityFetch<CorporatePageData>(CORPORATE_PAGE_QUERY);

  const heroTitle = isAr ? data?.heroTitleAr : data?.heroTitleEn;
  const heroSubtitle = isAr ? data?.heroSubtitleAr : data?.heroSubtitleEn;
  const ctaLabel = (isAr ? data?.ctaLabelAr : data?.ctaLabelEn)
    ?? (isAr ? 'أرسل استفساراً' : 'Send enquiry');

  return (
    <>
      <SiteHeader locale={typedLocale} />
      <main id="main-content" className="min-h-screen">
        {/* Hero */}
        <div
          className="relative py-24 bg-[var(--color-brand-primary)] text-white"
          style={
            data?.heroImage?.asset.url
              ? {
                  backgroundImage: `url(${data.heroImage.asset.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <div className="relative container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {heroTitle ?? (isAr ? '[PLACEHOLDER] شراكات الشركات' : '[PLACEHOLDER] Corporate Partnerships')}
            </h1>
            {heroSubtitle && (
              <p className="text-lg md:text-xl max-w-2xl opacity-90">{heroSubtitle}</p>
            )}
          </div>
        </div>

        {/* Service cards */}
        {data?.serviceCards && data.serviceCards.length > 0 && (
          <section className="bg-[var(--color-surface-muted)] py-16" aria-label={isAr ? 'خدماتنا' : 'Our services'}>
            <div className="container mx-auto px-4">
              <ul
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                role="list"
              >
                {data.serviceCards.map((card, i) => (
                  <li key={i} className="bg-white rounded-lg p-6 shadow-sm text-center">
                    {card.icon && (
                      <div className="text-3xl mb-3" aria-hidden="true">
                        {/* Icon placeholder — rendered via design system in full implementation */}
                        ☕
                      </div>
                    )}
                    <h3 className="font-semibold mb-2">
                      {(isAr ? card.titleAr : card.titleEn) ?? '[PLACEHOLDER]'}
                    </h3>
                    {(isAr ? card.descriptionAr : card.descriptionEn) && (
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {isAr ? card.descriptionAr : card.descriptionEn}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Enquiry form placeholder (Phase 2) */}
        <section className="container mx-auto px-4 py-16 max-w-2xl" aria-labelledby="enquiry-heading">
          <h2 id="enquiry-heading" className="text-2xl font-bold mb-2">
            {isAr ? '[PLACEHOLDER] تواصل معنا' : '[PLACEHOLDER] Get in touch'}
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            {/* [PLACEHOLDER] copy requires Marketing approval */}
            {isAr
              ? '[PLACEHOLDER] نص التواصل يتطلب موافقة التسويق'
              : '[PLACEHOLDER] Contact copy requires Marketing approval'}
          </p>

          {/* Phase 2: Replace with actual form component */}
          <div
            className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-12 text-center text-[var(--color-text-secondary)]"
            role="status"
          >
            {isAr
              ? 'نموذج الاستفسار — المرحلة الثانية'
              : 'Enquiry form — Phase 2'}
          </div>

          {/* Fallback email */}
          {data?.enquiryEmail && (
            <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
              {isAr ? 'أو راسلنا على: ' : 'Or email us: '}
              <a
                href={`mailto:${data.enquiryEmail}`}
                className="text-[var(--color-brand-primary)] underline underline-offset-2"
              >
                {data.enquiryEmail}
              </a>
            </p>
          )}
        </section>
      </main>
      <SiteFooter locale={typedLocale} />
    </>
  );
}
