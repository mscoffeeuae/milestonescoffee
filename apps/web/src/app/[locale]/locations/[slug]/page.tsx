import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@milestones/contracts';
import { sanityFetch } from '@/lib/sanity/client';
import { BRANCH_BY_SLUG_QUERY } from '@/lib/sanity/queries';
import { BRANCHES_FALLBACK } from '@/lib/branches-fallback';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { BranchStatus, WeeklyHours, type OpeningHours } from '@/components/locations/branch-status';
import { BranchTools } from '@/components/locations/branch-tools';
import { BranchMobileBar } from '@/components/locations/branch-mobile-bar';
import { BranchGallery } from '@/components/locations/branch-gallery';
import { BranchNearby } from '@/components/locations/branch-nearby';
import { BranchQr } from '@/components/locations/branch-qr';
import { BranchDirections } from '@/components/locations/branch-directions';
import { distanceKm } from '@/lib/geo';

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
  whatsapp?: string | null;
  heroImage: { asset: { url: string } } | null;
  galleryImages?: { asset: { url: string } | null }[] | null;
  seo: {
    titleEn: string | null;
    titleAr: string | null;
    descriptionEn: string | null;
    descriptionAr: string | null;
    noIndex: boolean | null;
  } | null;
}

const SUPPORTED_LOCALES: Locale[] = ['en', 'ar'];

// Service keys surfaced in the accessibility section (labels come from SERVICES below).
const ACCESS_KEYS = ['accessible', 'parking', 'prayer-room'] as const;

// Print: show only name, address and hours, in black on white.
const PRINT_CSS = '@media print{header,footer,iframe{display:none!important}.branch-hero{background:#fff!important;color:#000!important}.branch-hero *{color:#000!important;background:none!important}.branch-hero [aria-hidden]{display:none!important}}';

const SCHEMA_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

/** Public origin of this request (works for any domain the site is served on). */
async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'milestones.click';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

function openingHoursSpec(hours: OpeningHours | null) {
  if (!hours) return undefined;
  return SCHEMA_DAYS.flatMap((day) => {
    const k = day.toLowerCase();
    const opens = hours[`${k}Open`];
    const closes = hours[`${k}Close`];
    if (hours[`${k}Closed`] || typeof opens !== 'string' || typeof closes !== 'string') return [];
    return [{ '@type': 'OpeningHoursSpecification', dayOfWeek: day, opens, closes }];
  });
}

// Labels mirror apps/studio/src/schemas/documents/branch.ts
const EMIRATES: Record<string, [string, string]> = {
  'abu-dhabi': ['Abu Dhabi', 'أبوظبي'],
  dubai: ['Dubai', 'دبي'],
  sharjah: ['Sharjah', 'الشارقة'],
  ajman: ['Ajman', 'عجمان'],
  'umm-al-quwain': ['Umm Al Quwain', 'أم القيوين'],
  'ras-al-khaimah': ['Ras Al Khaimah', 'رأس الخيمة'],
  fujairah: ['Fujairah', 'الفجيرة'],
};

const SERVICES: Record<string, [string, string]> = {
  'dine-in': ['Dine in', 'تناول في المكان'],
  takeaway: ['Takeaway', 'سفري'],
  'drive-through': ['Drive-through', 'خدمة السيارات'],
  delivery: ['Delivery', 'توصيل'],
  wifi: ['WiFi', 'واي فاي'],
  'prayer-room': ['Prayer room', 'مصلى'],
  parking: ['Parking', 'مواقف'],
  accessible: ['Accessible', 'مهيأ لذوي الهمم'],
};

/** CMS record first; Google-sourced fallback until Sanity has the branch. */
async function getBranch(slug: string): Promise<Branch | null> {
  const cms = await sanityFetch<Branch>(BRANCH_BY_SLUG_QUERY, { slug });
  if (cms) return cms;
  return (BRANCHES_FALLBACK as unknown as Branch[]).find((b) => b.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) return {};
  const branch = await getBranch(slug);
  if (!branch) return {};

  const isAr = locale === 'ar';
  const title = isAr ? (branch.seo?.titleAr ?? branch.nameAr) : (branch.seo?.titleEn ?? branch.nameEn);
  const description = isAr
    ? (branch.seo?.descriptionAr ?? `${branch.nameAr} — ${EMIRATES[branch.emirate]?.[1] ?? ''}`)
    : (branch.seo?.descriptionEn ?? `${branch.nameEn} in ${EMIRATES[branch.emirate]?.[0] ?? ''}`);

  return {
    metadataBase: new URL(await getOrigin()),
    title,
    description,
    robots: branch.seo?.noIndex ? { index: false } : undefined,
    alternates: {
      languages: { en: `/en/locations/${slug}`, ar: `/ar/locations/${slug}` },
    },
    openGraph: { title, description, type: 'website', siteName: 'Milestones Coffee', locale: isAr ? 'ar_AE' : 'en_AE' },
  };
}

export default async function BranchPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();

  const typedLocale = locale as Locale;
  const isAr = typedLocale === 'ar';

  const branch = await getBranch(slug);
  if (!branch) notFound();

  const name = isAr ? branch.nameAr : branch.nameEn;
  const address = isAr ? branch.addressAr : branch.addressEn;
  const note = isAr ? branch.openingHoursNoteAr : branch.openingHoursNoteEn;
  const emirateName = EMIRATES[branch.emirate]?.[isAr ? 1 : 0] ?? branch.emirate;
  const c = branch.coordinates;
  const origin = await getOrigin();
  const pageUrl = `${origin}/${typedLocale}/locations/${slug}`;
  const directionsUrl =
    branch.googleMapsUrl ?? (c ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}` : null);
  const whatsappDigits = branch.whatsapp?.replace(/D/g, '') ?? '';
  const allBranches = BRANCHES_FALLBACK as unknown as Branch[];
  const nearby = c
    ? allBranches
        .flatMap((b) => (b.slug !== slug && b.coordinates ? [{ b, km: distanceKm(c, b.coordinates) }] : []))
        .sort((x, y) => x.km - y.km)
        .slice(0, 3)
        .map(({ b, km }) => ({
          slug: b.slug,
          name: isAr ? b.nameAr : b.nameEn,
          area: EMIRATES[b.emirate]?.[isAr ? 1 : 0] ?? b.emirate,
          km,
        }))
    : [];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: branch.nameEn,
    alternateName: branch.nameAr,
    url: pageUrl,
    ...(branch.phone ? { telephone: branch.phone } : {}),
    ...(branch.heroImage?.asset?.url ? { image: branch.heroImage.asset.url } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(branch.addressEn ? { streetAddress: branch.addressEn } : {}),
      addressRegion: EMIRATES[branch.emirate]?.[0] ?? branch.emirate,
      addressCountry: 'AE',
    },
    ...(c ? { geo: { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lng } } : {}),
    ...(branch.openingHours ? { openingHoursSpecification: openingHoursSpec(branch.openingHours) } : {}),
    ...(branch.googleMapsUrl ? { hasMap: branch.googleMapsUrl } : {}),
  };
  const accessItems = ACCESS_KEYS.filter((k) => branch.services?.includes(k));
  const otherLocale = isAr ? 'en' : 'ar';
  const mapSrc = c
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${c.lng - 0.006},${c.lat - 0.004},${c.lng + 0.006},${c.lat + 0.004}&layer=mapnik&marker=${c.lat},${c.lng}`
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so branch text can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
      />
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <SiteHeader locale={typedLocale} />
      <main id="main-content" className="min-h-screen bg-[var(--color-brand-ivory,#F5F0E8)]">
        {/* Hero */}
        <section className="branch-hero relative overflow-hidden bg-[var(--color-brand-espresso,#3B1F0E)] text-white">
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #C9A87C 0, transparent 40%), radial-gradient(circle at 10% 90%, #A0784A 0, transparent 35%)' }}
          />
          <div className="container relative mx-auto px-4 py-10 md:py-16">
            <nav aria-label={isAr ? 'مسار التنقل' : 'Breadcrumb'} className="text-sm text-white/60">
              <Link href={`/${typedLocale}/locations`} className="no-underline hover:text-white">
                {isAr ? 'فروعنا' : 'Locations'}
              </Link>
              <span className="mx-2" aria-hidden>/</span>
              <span>{emirateName}</span>
            </nav>
            <div className="mt-4">
              {branch.openingHours && <BranchStatus hours={branch.openingHours} isAr={isAr} />}
            </div>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight md:text-6xl" style={{ color: '#fff' }}>{name}</h1>
            {!isAr && branch.nameAr && (
              <p className="mt-1 text-lg text-white/70" dir="rtl" lang="ar">{branch.nameAr}</p>
            )}
            <Link
              href={`/${otherLocale}/locations/${slug}`}
              hrefLang={otherLocale}
              lang={otherLocale}
              className="mt-5 inline-block rounded-full border border-white/40 px-3 py-1 text-xs font-semibold text-white no-underline hover:bg-white/10 print:hidden"
            >
              {isAr ? 'English' : 'العربية'}
            </Link>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="print:hidden">
            <BranchGallery
              isAr={isAr}
              name={name}
              images={[...(branch.heroImage ? [branch.heroImage] : []), ...(branch.galleryImages ?? [])]}
            />
            </div>

            {mapSrc && (
              <iframe
                title={`${isAr ? 'خريطة' : 'Map of'} ${name}`}
                src={mapSrc}
                className="h-72 w-full rounded-2xl ring-1 ring-black/5 md:h-96"
                loading="lazy"
              />
            )}

            {branch.services && branch.services.length > 0 && (
              <section aria-labelledby="svc-h" className="ms-surface ms-pad">
                <h2 id="svc-h" className="mb-4 text-xl font-bold text-[var(--color-brand-espresso,#3B1F0E)]">
                  {isAr ? 'الخدمات المتاحة' : 'Available services'}
                </h2>
                <ul className="flex flex-wrap gap-2" role="list">
                  {branch.services.map((s) => (
                    <li key={s} className="rounded-full bg-[var(--color-brand-ivory,#F5F0E8)] px-3 py-1 text-sm text-[var(--color-brand-espresso,#3B1F0E)] ring-1 ring-[var(--color-brand-gold,#C9A87C)]/40">
                      {SERVICES[s]?.[isAr ? 1 : 0] ?? s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {accessItems.length > 0 && (
              <section aria-labelledby="access-h" className="ms-surface ms-pad">
                <h2 id="access-h" className="mb-4 text-xl font-bold text-[var(--color-brand-espresso,#3B1F0E)]">
                  {isAr ? 'إمكانية الوصول والمرافق' : 'Accessibility & facilities'}
                </h2>
                <ul role="list" className="grid gap-2 text-sm sm:grid-cols-3">
                  {accessItems.map((k) => (
                    <li key={k} className="flex items-center gap-2">
                      <span aria-hidden className="text-emerald-600">✓</span>
                      {SERVICES[k]?.[isAr ? 1 : 0] ?? k}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="print:hidden">
              <BranchNearby isAr={isAr} locale={typedLocale} items={nearby} />
            </div>

            <div>
              <Link href={`/${typedLocale}/locations`} className="text-sm font-semibold text-[var(--color-brand-bronze,#A0784A)] no-underline hover:underline">
                {isAr ? '→ جميع الفروع' : '← All branches'}
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="print:hidden">
            <BranchTools
              isAr={isAr}
              slug={branch.slug}
              name={name}
              address={address}
              coords={c}
              others={allBranches.flatMap((b) =>
                b.coordinates ? [{ name: isAr ? b.nameAr : b.nameEn, slug: b.slug, lat: b.coordinates.lat, lng: b.coordinates.lng }] : [],
              )}
            />
            </div>
            <section className="ms-surface ms-pad">
              <h2 className="mb-2 text-lg font-bold text-[var(--color-brand-espresso,#3B1F0E)]">{isAr ? 'العنوان' : 'Address'}</h2>
              {address && <address className="text-sm not-italic text-black/60">{address}</address>}
              <div className="mt-4 flex flex-col gap-2">
                {branch.googleMapsUrl && (
                  <a
                    href={branch.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-btn ms-btn-primary"
                  >
                    {isAr ? 'احصل على الاتجاهات' : 'Get directions'}
                  </a>
                )}
                {whatsappDigits && (
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-btn ms-btn-secondary"
                  >
                    WhatsApp
                  </a>
                )}
                {branch.phone && (
                  <a
                    href={`tel:${branch.phone.replace(/\s+/g, '')}`}
                    className="ms-btn ms-btn-secondary"
                  >
                    <span dir="ltr">{isAr ? 'اتصل' : 'Call'} {branch.phone}</span>
                  </a>
                )}
              </div>
              <BranchDirections isAr={isAr} coords={c} address={address} />
            </section>

            <div className="print:hidden">
              <BranchQr isAr={isAr} url={pageUrl} name={name} />
            </div>

            {branch.openingHours && (
              <section className="ms-surface ms-pad">
                <h2 className="mb-3 text-lg font-bold text-[var(--color-brand-espresso,#3B1F0E)]">{isAr ? 'ساعات العمل' : 'Opening hours'}</h2>
                <WeeklyHours hours={branch.openingHours} isAr={isAr} />
                {note && <p className="mt-3 text-xs text-amber-800">{note}</p>}
              </section>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter locale={typedLocale} />
      <BranchMobileBar isAr={isAr} directionsUrl={directionsUrl} phone={branch.phone} />
      {/* Spacer so the sticky bar never covers the footer on phones */}
      <div aria-hidden className="h-20 md:hidden" />
    </>
  );
}
