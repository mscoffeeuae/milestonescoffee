import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@milestones/contracts';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export const dynamic = 'force-static';

const SUPPORTED_LOCALES: Locale[] = ['en', 'ar'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) return {};
  const isAr = locale === 'ar';
  return {
    title: isAr ? 'من نحن' : 'About Us',
    alternates: { languages: { en: '/en/about', ar: '/ar/about' } },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();
  const typedLocale = locale as Locale;
  const isAr = typedLocale === 'ar';

  const pillars = [
    {
      title: isAr ? 'التراث' : 'Heritage',
      body: isAr ? '[PLACEHOLDER — فقرة التراث بانتظار الاعتماد]' : '[PLACEHOLDER: heritage paragraph, pending Marketing approval]',
    },
    {
      title: isAr ? 'الحرفية' : 'Craft',
      body: isAr
        ? 'حبوب مختارة وتحميص يومي بعناية. [PLACEHOLDER — تفاصيل التحميص]'
        : 'Carefully selected beans, roasted with care. [PLACEHOLDER: roasting detail]',
    },
    {
      title: isAr ? 'المجتمع' : 'Community',
      body: isAr ? '[PLACEHOLDER — التزامات المجتمع]' : '[PLACEHOLDER: community commitments]',
    },
  ];

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        {isAr ? 'انتقل إلى المحتوى الرئيسي' : 'Skip to main content'}
      </a>
      <SiteHeader locale={typedLocale} />
      <main id="main-content" className="min-h-screen bg-[var(--color-brand-ivory,#F5F0E8)]">
        <div className="container mx-auto px-4 py-12">
          <section className="rounded-md bg-[var(--color-brand-espresso,#3B1F0E)] p-8 text-white md:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-gold,#C9A87C)]">
              {isAr ? 'قصتنا' : 'Our story'}
            </p>
            <h1 className="mt-3 text-4xl font-semibold md:text-5xl" style={{ color: '#fff' }}>
              {isAr ? 'قهوة بمعنى الإنجاز' : 'Coffee with a milestone in every cup'}
            </h1>
            <p className="mt-4 max-w-2xl text-white/80">
              {isAr
                ? 'علامة إماراتية أصيلة تقدم قهوة مختصة في مختلف الإمارات. [PLACEHOLDER — قصة التأسيس]'
                : 'A proud Emirati brand serving specialty coffee across the emirates. [PLACEHOLDER: founding story]'}
            </p>
          </section>

          <ul role="list" className="mt-8 grid list-none gap-5 p-0 md:grid-cols-3">
            {pillars.map((p) => (
              <li key={p.title} className="min-w-0 rounded-md border-t-[3px] border-[var(--color-brand-gold,#C9A87C)] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-[var(--color-brand-espresso,#3B1F0E)]">{p.title}</h2>
                <p className="mt-2 text-sm text-black/60">{p.body}</p>
              </li>
            ))}
          </ul>

          <section className="mt-10 rounded-md bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-[var(--color-brand-espresso,#3B1F0E)]">
              {isAr ? 'أين نحن' : 'Where we are'}
            </h2>
            <p className="mt-2 text-sm text-black/60">
              {isAr ? 'فروع في أبوظبي ودبي.' : 'Branches across Abu Dhabi and Dubai.'}{' '}
              <Link href={`/${typedLocale}/locations`} className="font-semibold text-[var(--color-brand-bronze,#A0784A)] underline-offset-4 hover:underline">
                {isAr ? 'عرض جميع الفروع' : 'See all branches'}
              </Link>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter locale={typedLocale} />
    </>
  );
}
