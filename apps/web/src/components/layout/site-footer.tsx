import type { Locale } from '@milestones/contracts';

interface SiteFooterProps {
  locale: Locale;
}

/** Social icon SVGs (inline, no external dependency) */
function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

export function SiteFooter({ locale }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const isAr = locale === 'ar';

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
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-2xl)',
          marginBottom: 'var(--spacing-2xl)',
        }}
      >
        {/* Brand column */}
        <div>
          <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-ivory)' }}>
            {isAr ? 'ميلستونز كوفي' : 'Milestones Coffee'}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
            {isAr
              ? 'علامة إماراتية أصيلة — ٣٠+ فرعاً في أبوظبي والعين'
              : 'A proud Emirati brand — 30+ branches across Abu Dhabi & Al-Ain'}
          </p>
          {/* Social links */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
            <a
              href="https://www.facebook.com/milestones.coffee2021"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Milestones Coffee on Facebook"
              style={{ color: 'rgba(255,255,255,0.7)', transition: 'color 0.2s' }}
            >
              <FacebookIcon />
            </a>
            <a
              href="https://www.instagram.com/milestones_coffee/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Milestones Coffee on Instagram"
              style={{ color: 'rgba(255,255,255,0.7)', transition: 'color 0.2s' }}
            >
              <InstagramIcon />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <nav aria-label={isAr ? 'روابط سريعة' : 'Quick links'}>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 'var(--spacing-md)' }}>
            {isAr ? 'روابط سريعة' : 'Quick Links'}
          </p>
          <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {[
              { href: `/${locale}/menu`, label: isAr ? 'القائمة' : 'Menu' },
              { href: `/${locale}/locations`, label: isAr ? 'فروعنا' : 'Locations' },
              { href: `/${locale}/corporate`, label: isAr ? 'الشركات' : 'Corporate' },
            ].map(({ href, label }) => (
              <li key={href}>
                <a href={href} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Legal links */}
        <nav aria-label={isAr ? 'روابط قانونية' : 'Legal'}>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 'var(--spacing-md)' }}>
            {isAr ? 'قانوني' : 'Legal'}
          </p>
          <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {[
              { href: `/${locale}/privacy`, label: isAr ? 'سياسة الخصوصية' : 'Privacy Policy' },
              { href: `/${locale}/terms`, label: isAr ? 'الشروط والأحكام' : 'Terms & Conditions' },
            ].map(({ href, label }) => (
              <li key={href}>
                <a href={href} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 'var(--spacing-lg)', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          &copy; {year} Milestones Coffee.{' '}
          {isAr ? 'جميع الحقوق محفوظة — الإمارات العربية المتحدة' : 'All rights reserved. UAE'}
        </p>
      </div>
    </footer>
  );
}
