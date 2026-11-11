import { notFound } from 'next/navigation';
import type { Locale } from '@milestones/contracts';
import { getDict } from '@milestones/i18n';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const supportedLocales: Locale[] = ['en', 'ar'];

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  if (!supportedLocales.includes(locale as Locale)) notFound();

  const dict = getDict(locale as Locale);

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        {locale === 'ar' ? 'انتقل إلى المحتوى الرئيسي' /* [PLACEHOLDER] */ : 'Skip to main content'}
      </a>
      <SiteHeader locale={locale as Locale} dict={dict} />
      <main id="main-content">
        {/* Hero section — content requires approved copy and imagery */}
        <section
          aria-label={locale === 'ar' ? 'القسم الرئيسي' /* [PLACEHOLDER] */ : 'Hero'}
          style={{
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-3xl) var(--spacing-xl)',
            textAlign: 'center',
            background: 'var(--color-bg-muted)',
          }}
        >
          {/* ⚠ PLACEHOLDER — Replace with approved hero copy and imagery */}
          <p
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-brand-bronze)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            {locale === 'ar'
              ? '⚠ PLACEHOLDER — يتطلب نص معتمد'
              : '⚠ PLACEHOLDER — Requires approved copy'}
          </p>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-brand-espresso)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            {locale === 'ar' ? 'ميلستونز كوفي' /* [PLACEHOLDER] */ : 'Milestones Coffee'}
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              color: 'var(--color-text-secondary)',
              maxWidth: '600px',
              marginBottom: 'var(--spacing-2xl)',
            }}
          >
            {locale === 'ar'
              ? '[PLACEHOLDER — يتطلب نسخة معتمدة من فريق التسويق]'
              : '[PLACEHOLDER — Requires approved copy from Marketing]'}
          </p>
        </section>
      </main>
      <SiteFooter locale={locale as Locale} dict={dict} />
    </>
  );
}
