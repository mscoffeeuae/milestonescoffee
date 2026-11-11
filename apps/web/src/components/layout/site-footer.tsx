import type { Locale } from '@milestones/contracts';

interface SiteFooterProps {
  locale: Locale;
}

/**
 * Site footer — public-facing.
 *
 * ⚠ PLACEHOLDER — footer links, legal copy, and social links require
 *   Marketing and Legal approval before launch.
 */
export function SiteFooter({ locale }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      style={{
        background: 'var(--color-brand-espresso)',
        color: 'var(--color-text-on-dark)',
        padding: 'var(--spacing-2xl) var(--spacing-xl)',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-lg)',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* ⚠ PLACEHOLDER — footer navigation requires IA approval */}
        <nav aria-label={locale === 'ar' ? 'روابط التذييل' /* [PLACEHOLDER] */ : 'Footer navigation'}>
          <ul
            role="list"
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              gap: 'var(--spacing-lg)',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <li>
              <a
                href={`/${locale}/about`}
                style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.875rem' }}
              >
                {locale === 'ar' ? 'عنّا' /* [PLACEHOLDER] */ : 'About'}
              </a>
            </li>
            <li>
              <a
                href={`/${locale}/contact`}
                style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.875rem' }}
              >
                {locale === 'ar' ? 'تواصل معنا' /* [PLACEHOLDER] */ : 'Contact'}
              </a>
            </li>
            <li>
              <a
                href={`/${locale}/privacy`}
                style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.875rem' }}
              >
                {locale === 'ar' ? 'سياسة الخصوصية' /* [PLACEHOLDER] */ : 'Privacy Policy'}
              </a>
            </li>
          </ul>
        </nav>

        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          {/* ⚠ PLACEHOLDER — legal entity name and registration requires confirmation */}
          &copy; {year} Milestones Coffee. {locale === 'ar' ? 'جميع الحقوق محفوظة' /* [PLACEHOLDER] */ : 'All rights reserved.'}{' '}
          {locale === 'ar' ? 'الإمارات العربية المتحدة' /* [PLACEHOLDER] */ : 'UAE'}
        </p>
      </div>
    </footer>
  );
}
