import type { Locale } from '@milestones/contracts';
import { getDict } from '@milestones/i18n';

interface SiteHeaderProps {
  locale: Locale;
}

/** Locale switcher — links between /en and /ar */
function LocaleSwitcher({ locale }: { locale: Locale }) {
  const other = locale === 'en' ? 'ar' : 'en';
  const label = locale === 'en' ? 'العربية' : 'English';
  return (
    <a
      href={`/${other}`}
      hrefLang={other}
      aria-label={locale === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية' /* [PLACEHOLDER] */}
      style={{
        color: 'var(--color-text-on-dark)',
        textDecoration: 'none',
        fontSize: '0.875rem',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(255,255,255,0.3)',
      }}
    >
      {label}
    </a>
  );
}

/**
 * Site header — public-facing navigation shell.
 *
 * ⚠ PLACEHOLDER — Navigation links require approved information architecture.
 *   Logo requires brand kit approval before display.
 */
export function SiteHeader({ locale }: SiteHeaderProps) {
  const dict = getDict(locale);
  return (
    <header
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-raised)' as never,
        background: 'var(--color-brand-espresso)',
        color: 'var(--color-text-on-dark)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 var(--spacing-xl)',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--spacing-lg)',
        }}
      >
        {/* Logo placeholder — replace with <Image> of approved brand logo */}
        <a
          href={`/${locale}`}
          aria-label={locale === 'ar' ? 'ميلستونز كوفي — الصفحة الرئيسية' /* [PLACEHOLDER] */ : 'Milestones Coffee — Home'}
          style={{
            color: 'var(--color-brand-ivory)',
            textDecoration: 'none',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '1.25rem',
            letterSpacing: '0.02em',
          }}
        >
          {/* ⚠ PLACEHOLDER — Replace with approved <Image src="/logo.svg" ... /> */}
          Milestones Coffee
        </a>

        {/* Navigation — ⚠ PLACEHOLDER pending information architecture approval */}
        <nav aria-label={locale === 'ar' ? 'القائمة الرئيسية' /* [PLACEHOLDER] */ : 'Main navigation'}>
          <ul
            role="list"
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              gap: 'var(--spacing-lg)',
              alignItems: 'center',
            }}
          >
            <li>
              <a
                href={`/${locale}/menu`}
                style={{ color: 'var(--color-text-on-dark)', textDecoration: 'none', fontSize: '0.9375rem' }}
              >
                {dict.nav.menu}
              </a>
            </li>
            <li>
              <a
                href={`/${locale}/branches`}
                style={{ color: 'var(--color-text-on-dark)', textDecoration: 'none', fontSize: '0.9375rem' }}
              >
                {dict.nav.branches}
              </a>
            </li>
            <li>
              <LocaleSwitcher locale={locale} />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
