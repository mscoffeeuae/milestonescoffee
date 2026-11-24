import type { Metadata } from 'next';
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
    title: isAr ? 'وظائف' : 'Careers',
    alternates: { languages: { en: '/en/careers', ar: '/ar/careers' } },
  };
}

export default async function CareersPage({ params }: { params: Promise<{ locale: string }> }) {
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
              {isAr ? 'انضم إلى الفريق' : 'Join the team'}
            </p>
            <h1 className="mt-3 text-4xl font-semibold md:text-5xl" style={{ color: '#fff' }}>
              {isAr ? 'ابنِ مسيرتك معنا' : 'Build your career with us'}
            </h1>
            <p className="mt-4 max-w-2xl text-white/80">
              {isAr ? 'أخبرنا عن نفسك والدور الذي تبحث عنه. [PLACEHOLDER — وصف الثقافة]' : 'Tell us about yourself and the role you are looking for. [PLACEHOLDER: culture paragraph]'}
            </p>
          </section>

          <section className="mt-8 rounded-md bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-[var(--color-brand-espresso,#3B1F0E)]">
              {isAr ? 'الوظائف المتاحة' : 'Open roles'}
            </h2>
            <p className="mt-2 text-sm text-black/60">
              {isAr ? 'لا توجد وظائف معلنة حالياً. تابعنا لاحقاً.' : 'No roles are listed right now. Check back soon.'}
            </p>
            <p className="mt-3 text-sm text-black/50">[PLACEHOLDER: list open roles once supplied]</p>
          </section>

          <section className="mt-8 rounded-md bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-[var(--color-brand-espresso,#3B1F0E)]">
              {isAr ? 'أرسل سيرتك الذاتية' : 'Send your CV'}
            </h2>
            <p className="mt-2 text-sm text-black/60">
              {isAr ? 'أرسل سيرتك الذاتية مع رسالة قصيرة إلى' : 'Email your CV and a short note to'}{' '}
              <span className="text-black/50">[PLACEHOLDER: careers email]</span>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter locale={typedLocale} />
    </>
  );
}
