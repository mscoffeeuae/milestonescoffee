import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@milestones/contracts';
import { getDict } from '@milestones/i18n';
import { sanityFetch } from '@/lib/sanity/client';
import { BRANCHES_QUERY } from '@/lib/sanity/queries';
import { BRANCHES_FALLBACK } from '@/lib/branches-fallback';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { BranchesExplorer, type ExplorerBranch } from '@/components/locations/branches-explorer';

export const dynamic = 'force-dynamic';

const SUPPORTED_LOCALES: Locale[] = ['en', 'ar'];
const BEAN_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><ellipse cx='32' cy='32' rx='5' ry='8' transform='rotate(35 32 32)' fill='%23C9A87C' fill-opacity='0.12'/></svg>\")";

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

export default async function LocationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();

  const typedLocale = locale as Locale;
  const isAr = typedLocale === 'ar';
  const cms = (await sanityFetch<ExplorerBranch[]>(BRANCHES_QUERY)) ?? [];
  // CMS first; Google-sourced fallback until Sanity has the branches.
  const branches: ExplorerBranch[] = cms.length > 0 ? cms : (BRANCHES_FALLBACK as ExplorerBranch[]);
  const emirates = new Set(branches.map((b) => b.emirate)).size;
  const services = new Set(branches.flatMap((b) => b.services ?? [])).size;

  return (
    <>
      <SiteHeader locale={typedLocale} />
      <main id="main-content" className="min-h-screen bg-[var(--color-brand-ivory,#F5F0E8)]">
        <section className="relative overflow-hidden bg-[var(--color-brand-espresso,#3B1F0E)] text-white">
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #C9A87C 0, transparent 40%), radial-gradient(circle at 10% 90%, #A0784A 0, transparent 35%)' }}
          />
          <div aria-hidden className="absolute inset-0" style={{ backgroundImage: BEAN_BG }} />
          <div className="container relative mx-auto px-4 py-16 md:py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-gold,#C9A87C)]">
              Milestones Coffee
            </p>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold" style={{ color: '#fff' }}>
              {/* [PLACEHOLDER] */}
              {isAr ? 'فروعنا' : 'Our Locations'}
            </h1>
            <dl className="mt-8 flex flex-wrap gap-8">
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/60">{isAr ? 'الفروع' : 'Branches'}</dt>
                <dd className="text-3xl font-bold text-[var(--color-brand-gold,#C9A87C)]">{branches.length}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/60">{isAr ? 'الإمارات' : 'Emirates'}</dt>
                <dd className="text-3xl font-bold text-[var(--color-brand-gold,#C9A87C)]">{emirates}</dd>
              </div>
              {services > 0 && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/60">{isAr ? 'الخدمات' : 'Services'}</dt>
                  <dd className="text-3xl font-bold text-[var(--color-brand-gold,#C9A87C)]">{services}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10">
          {branches.length > 0 ? (
            <BranchesExplorer branches={branches} locale={typedLocale as 'en' | 'ar'} />
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
