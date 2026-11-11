import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@milestones/contracts';
import { getDict } from '@milestones/i18n';
import { sanityFetch } from '@/lib/sanity/client';
import { BRANCHES_QUERY } from '@/lib/sanity/queries';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

/** ─── Types ─────────────────────────────────────────────────────────── */
interface Branch {
  _id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  emirate: string;
  addressEn: string | null;
  addressAr: string | null;
  googleMapsUrl: string | null;
  services: string[] | null;
  phone: string | null;
  heroImage: { asset: { url: string } } | null;
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
    title: dict.nav.branches,
    alternates: {
      languages: { en: '/en/locations', ar: '/ar/locations' },
    },
  };
}

/** ─── Page ───────────────────────────────────────────────────────────── */
export default async function LocationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();

  const typedLocale = locale as Locale;
  const isAr = typedLocale === 'ar';
  const branches = await sanityFetch<Branch[]>(BRANCHES_QUERY);

  // Group by emirate
  const byEmirate = new Map<string, Branch[]>();
  for (const branch of branches ?? []) {
    const existing = byEmirate.get(branch.emirate) ?? [];
    existing.push(branch);
    byEmirate.set(branch.emirate, existing);
  }

  const emirateLabels: Record<string, string> = {
    'abu-dhabi': 'Abu Dhabi',
    dubai: 'Dubai',
    sharjah: 'Sharjah',
    ajman: 'Ajman',
    'umm-al-quwain': 'Umm Al Quwain',
    'ras-al-khaimah': 'Ras Al Khaimah',
    fujairah: 'Fujairah',
  };

  return (
    <>
      <SiteHeader locale={typedLocale} />
      <main id="main-content" className="min-h-screen">
        {/* Page header */}
        <div className="bg-[var(--color-brand-primary)] text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold">
              {/* [PLACEHOLDER] */}
              {isAr ? 'فروعنا' : 'Our Locations'}
            </h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {byEmirate.size > 0 ? (
            Array.from(byEmirate.entries()).map(([emirate, emirateBranches]) => (
              <section key={emirate} className="mb-12" aria-labelledby={`emirate-${emirate}`}>
                <h2
                  id={`emirate-${emirate}`}
                  className="text-xl font-semibold mb-6 pb-2 border-b"
                >
                  {emirateLabels[emirate] ?? emirate}
                </h2>

                <ul
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  role="list"
                >
                  {emirateBranches.map((branch) => (
                    <li key={branch._id}>
                      <a
                        href={`/${typedLocale}/locations/${branch.slug}`}
                        className="block border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]"
                      >
                        {branch.heroImage?.asset.url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={branch.heroImage.asset.url}
                            alt=""
                            aria-hidden="true"
                            className="w-full h-40 object-cover"
                            loading="lazy"
                          />
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold">
                            {isAr ? branch.nameAr : branch.nameEn}
                          </h3>
                          {(isAr ? branch.addressAr : branch.addressEn) && (
                            <address className="text-sm text-[var(--color-text-secondary)] not-italic mt-1">
                              {isAr ? branch.addressAr : branch.addressEn}
                            </address>
                          )}
                          {branch.services && branch.services.length > 0 && (
                            <ul className="flex flex-wrap gap-1 mt-3" role="list">
                              {branch.services.map((svc) => (
                                <li
                                  key={svc}
                                  className="text-xs bg-[var(--color-surface-muted)] px-2 py-0.5 rounded"
                                >
                                  {svc}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <div className="text-center py-24" role="status">
              <p className="text-[var(--color-text-secondary)]">
                {isAr
                  ? '[PLACEHOLDER] بيانات الفروع ستتوفر قريباً'
                  : '[PLACEHOLDER] Branch data coming soon'}
              </p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter locale={typedLocale} />
    </>
  );
}
