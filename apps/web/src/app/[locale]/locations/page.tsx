import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@milestones/contracts';
import { getDict } from '@milestones/i18n';
import { sanityFetch } from '@/lib/sanity/client';
import { BRANCHES_QUERY } from '@/lib/sanity/queries';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { BranchStatus, WeeklyHours, type OpeningHours } from '@/components/locations/branch-status';

export const dynamic = 'force-dynamic';

interface Branch {
  _id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  emirate: string;
  addressEn: string | null;
  addressAr: string | null;
  googleMapsUrl: string | null;
  coordinates: { lat: number; lng: number } | null;
  openingHours: OpeningHours | null;
  openingHoursNoteEn: string | null;
  openingHoursNoteAr: string | null;
  services: string[] | null;
  phone: string | null;
  heroImage: { asset: { url: string } } | null;
}

const SUPPORTED_LOCALES: Locale[] = ['en', 'ar'];

const EMIRATES: Record<string, [string, string]> = {
  'abu-dhabi': ['Abu Dhabi', 'أبوظبي'],
  dubai: ['Dubai', 'دبي'],
  sharjah: ['Sharjah', 'الشارقة'],
  ajman: ['Ajman', 'عجمان'],
  'umm-al-quwain': ['Umm Al Quwain', 'أم القيوين'],
  'ras-al-khaimah': ['Ras Al Khaimah', 'رأس الخيمة'],
  fujairah: ['Fujairah', 'الفجيرة'],
};

// Values mirror apps/studio/src/schemas/documents/branch.ts services list
const SERVICES: Record<string, [string, string, string]> = {
  'dine-in': ['Dine in', 'تناول في المكان', '🍽'],
  takeaway: ['Takeaway', 'سفري', '🥡'],
  'drive-through': ['Drive-through', 'خدمة السيارات', '🚗'],
  delivery: ['Delivery', 'توصيل', '🛵'],
  wifi: ['WiFi', 'واي فاي', '📶'],
  'prayer-room': ['Prayer room', 'مصلى', '🕌'],
  parking: ['Parking', 'مواقف', '🅿'],
  accessible: ['Accessible', 'مهيأ لذوي الهمم', '♿'],
};

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
    alternates: { languages: { en: '/en/locations', ar: '/ar/locations' } },
  };
}

function directionsUrl(b: Branch) {
  if (b.googleMapsUrl) return b.googleMapsUrl;
  if (b.coordinates) return `https://www.google.com/maps/dir/?api=1&destination=${b.coordinates.lat},${b.coordinates.lng}`;
  return null;
}

export default async function LocationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();

  const typedLocale = locale as Locale;
  const isAr = typedLocale === 'ar';
  const branches = (await sanityFetch<Branch[]>(BRANCHES_QUERY)) ?? [];

  const byEmirate = new Map<string, Branch[]>();
  for (const b of branches) byEmirate.set(b.emirate, [...(byEmirate.get(b.emirate) ?? []), b]);
  const emirateName = (e: string) => EMIRATES[e]?.[isAr ? 1 : 0] ?? e;

  const allServices = new Set(branches.flatMap((b) => b.services ?? []));

  return (
    <>
      <SiteHeader locale={typedLocale} />
      <main id="main-content" className="min-h-screen bg-[var(--color-brand-ivory,#F5F0E8)]">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[var(--color-brand-espresso,#3B1F0E)] text-white">
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #C9A87C 0, transparent 40%), radial-gradient(circle at 10% 90%, #A0784A 0, transparent 35%)' }}
          />
          <div className="container relative mx-auto px-4 py-16 md:py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-gold,#C9A87C)]">
              Milestones Coffee
            </p>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold" style={{ color: "#fff" }}>
              {/* [PLACEHOLDER] */}
              {isAr ? 'فروعنا' : 'Our Locations'}
            </h1>
            {branches.length > 0 && (
              <dl className="mt-8 flex flex-wrap gap-8">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/60">{isAr ? 'الفروع' : 'Branches'}</dt>
                  <dd className="text-3xl font-bold text-[var(--color-brand-gold,#C9A87C)]">{branches.length}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/60">{isAr ? 'الإمارات' : 'Emirates'}</dt>
                  <dd className="text-3xl font-bold text-[var(--color-brand-gold,#C9A87C)]">{byEmirate.size}</dd>
                </div>
                {allServices.size > 0 && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-white/60">{isAr ? 'الخدمات' : 'Services'}</dt>
                    <dd className="text-3xl font-bold text-[var(--color-brand-gold,#C9A87C)]">{allServices.size}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </section>

        {/* Emirate jump nav */}
        {byEmirate.size > 1 && (
          <nav aria-label={isAr ? 'تصفح حسب الإمارة' : 'Browse by emirate'} className="sticky top-0 z-20 border-b border-black/5 bg-[var(--color-brand-ivory,#F5F0E8)]/95 backdrop-blur shadow-sm">
            <ul className="container mx-auto flex gap-2 overflow-x-auto whitespace-nowrap px-4 py-3" role="list">
              {[...byEmirate.entries()].map(([e, list]) => (
                <li key={e}>
                  <a
                    href={`#emirate-${e}`}
                    className="no-underline inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-sm font-medium text-[var(--color-brand-espresso,#3B1F0E)] transition-colors hover:bg-[var(--color-brand-espresso,#3B1F0E)] hover:text-white"
                  >
                    {emirateName(e)} <span className="text-xs opacity-60">{list.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="container mx-auto px-4 py-12 space-y-14">
          {byEmirate.size > 0 ? (
            [...byEmirate.entries()].map(([emirate, list]) => (
              <section key={emirate} id={`emirate-${emirate}`} className="scroll-mt-24" aria-labelledby={`h-${emirate}`}>
                <div className="mb-6 flex items-end justify-between border-b border-[var(--color-brand-gold,#C9A87C)]/40 pb-3">
                  <h2 id={`h-${emirate}`} className="text-2xl md:text-3xl font-bold text-[var(--color-brand-espresso,#3B1F0E)]">
                    {emirateName(emirate)}
                  </h2>
                  <span className="text-sm text-black/40">
                    {list.length} {isAr ? 'فرع' : list.length === 1 ? 'branch' : 'branches'}
                  </span>
                </div>

                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
                  {list.map((b) => {
                    const name = isAr ? b.nameAr : b.nameEn;
                    const address = isAr ? b.addressAr : b.addressEn;
                    const note = isAr ? b.openingHoursNoteAr : b.openingHoursNoteEn;
                    const dir = directionsUrl(b);
                    return (
                      <li key={b._id} className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[var(--color-brand-espresso,#3B1F0E)] to-[var(--color-brand-bronze,#A0784A)]">
                          {b.heroImage?.asset.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={b.heroImage.asset.url}
                              alt=""
                              aria-hidden="true"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <span aria-hidden className="absolute inset-0 flex items-center justify-center text-5xl text-[var(--color-brand-gold,#C9A87C)]/60">☕</span>
                          )}
                          <div className="absolute top-3 start-3">
                            <BranchStatus hours={b.openingHours} isAr={isAr} />
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="text-lg font-semibold text-[var(--color-brand-espresso,#3B1F0E)]">
                            <a href={`/${typedLocale}/locations/${b.slug}`} className="no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">
                              {name}
                            </a>
                          </h3>
                          {!isAr && b.nameAr && <p className="text-sm text-black/40" dir="rtl" lang="ar">{b.nameAr}</p>}
                          {address && (
                            <address className="mt-2 flex gap-2 text-sm not-italic text-black/60">
                              <span aria-hidden>📍</span>
                              <span>{address}</span>
                            </address>
                          )}

                          {b.services && b.services.length > 0 && (
                            <ul className="mt-4 flex flex-wrap gap-1.5" role="list" aria-label={isAr ? 'الخدمات' : 'Services'}>
                              {b.services.map((s) => (
                                <li key={s} className="rounded-full bg-[var(--color-brand-ivory,#F5F0E8)] px-2.5 py-0.5 text-xs text-[var(--color-brand-espresso,#3B1F0E)] ring-1 ring-[var(--color-brand-gold,#C9A87C)]/40">
                                  <span aria-hidden>{SERVICES[s]?.[2]} </span>
                                  {SERVICES[s]?.[isAr ? 1 : 0] ?? s}
                                </li>
                              ))}
                            </ul>
                          )}

                          {b.openingHours && (
                            <details className="mt-4 rounded-lg bg-black/[0.02] px-3 py-2 ring-1 ring-black/5">
                              <summary className="cursor-pointer text-sm font-medium text-[var(--color-brand-espresso,#3B1F0E)]">
                                {isAr ? 'ساعات العمل' : 'Opening hours'}
                              </summary>
                              <div className="mt-2">
                                <WeeklyHours hours={b.openingHours} isAr={isAr} />
                                {note && <p className="mt-2 text-xs text-amber-800">{note}</p>}
                              </div>
                            </details>
                          )}

                          <div className="mt-auto flex gap-2 pt-5">
                            {dir && (
                              <a
                                href={dir}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="no-underline flex-1 rounded-full bg-[var(--color-brand-espresso,#3B1F0E)] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-brand-bronze,#A0784A)]"
                              >
                                {isAr ? 'الاتجاهات' : 'Directions'}
                              </a>
                            )}
                            {b.phone && (
                              <a
                                href={`tel:${b.phone.replace(/\s+/g, '')}`}
                                className="no-underline flex-1 rounded-full border border-[var(--color-brand-espresso,#3B1F0E)] px-4 py-2 text-center text-sm font-semibold text-[var(--color-brand-espresso,#3B1F0E)] transition hover:bg-[var(--color-brand-espresso,#3B1F0E)] hover:text-white"
                              >
                                <span dir="ltr">{isAr ? 'اتصل' : 'Call'}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          ) : (
            <div className="text-center py-24" role="status">
              <p className="text-black/60">
                {isAr ? '[PLACEHOLDER] بيانات الفروع ستتوفر قريباً' : '[PLACEHOLDER] Branch data coming soon'}
              </p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter locale={typedLocale} />
    </>
  );
}
