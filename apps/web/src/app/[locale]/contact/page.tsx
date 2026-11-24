import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@milestones/contracts';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { ContactForm } from './contact-form';

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
    title: isAr ? 'اتصل بنا' : 'Contact',
    alternates: { languages: { en: '/en/contact', ar: '/ar/contact' } },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();
  const typedLocale = locale as Locale;
  const isAr = typedLocale === 'ar';

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
              {isAr ? 'تواصل معنا' : 'Get in touch'}
            </p>
            <h1 className="mt-3 text-4xl font-semibold md:text-5xl" style={{ color: '#fff' }}>
              {isAr ? 'يسعدنا سماع رأيك' : 'We would love to hear from you'}
            </h1>
            <p className="mt-4 max-w-2xl text-white/80">
              {isAr ? 'أسئلة عن قهوتنا أو التموين أو أحد الفروع؟ أرسل لنا رسالة.' : 'Questions about our coffee, catering or a branch? Send us a message.'}
            </p>
          </section>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <ContactForm isAr={isAr} />

            <aside className="min-w-0 rounded-md bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-[var(--color-brand-espresso,#3B1F0E)]">
                {isAr ? 'بيانات التواصل' : 'Contact details'}
              </h2>
              <dl className="mt-4 grid gap-4 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-black/50">{isAr ? 'الهاتف' : 'Phone'}</dt>
                  <dd className="mt-1 text-black/70">[PLACEHOLDER: main phone]</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-black/50">{isAr ? 'البريد الإلكتروني' : 'Email'}</dt>
                  <dd className="mt-1 text-black/70">[PLACEHOLDER: email]</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-black/50">{isAr ? 'الفروع' : 'Branches'}</dt>
                  <dd className="mt-1">
                    <Link href={`/${typedLocale}/locations`} className="font-semibold text-[var(--color-brand-bronze,#A0784A)] underline-offset-4 hover:underline">
                      {isAr ? 'ابحث عن أقرب فرع' : 'Find the nearest branch'}
                    </Link>
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter locale={typedLocale} />
    </>
  );
}
