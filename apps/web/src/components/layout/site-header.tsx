import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@milestones/contracts';

interface SiteHeaderProps { locale: Locale; }

export function SiteHeader({ locale }: SiteHeaderProps) {
  const isAr = locale === 'ar';
  const navLinks = [
    { href: `/${locale}/menu`,        label: isAr ? 'القائمة'      : 'Our Menu' },
    { href: `/${locale}/locations`,   label: isAr ? 'فروعنا'       : 'Our Locations' },
    { href: `/${locale}/gallery`,     label: isAr ? 'معرض الصور'   : 'Gallery' },
    { href: `/${locale}/coffeebeans`, label: isAr ? 'حبوب القهوة'  : 'Coffee Beans' },
    { href: `/${locale}/contact`,     label: isAr ? 'تواصل معنا'   : 'Contact' },
  ];
  return (
    <header role="banner" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--color-border)', padding: '0 var(--spacing-xl)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <Link href={`/${locale}`} aria-label="Milestones Coffee — Home">
          <Image src="https://milestonescoffee.ae/wp-content/uploads/2024/11/mile_logo.png" alt="Milestones Coffee" width={120} height={40} priority style={{ objectFit: 'contain' }} />
        </Link>
        <nav aria-label={isAr ? 'التنقل الرئيسي' : 'Main navigation'} style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-brand-espresso)', textDecoration: 'none', padding: '4px 0', borderBottom: '2px solid transparent', transition: 'border-color 0.2s' }}>
              {label}
            </Link>
          ))}
        </nav>
        <Link href={locale === 'en' ? '/ar' : '/en'} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand-espresso)', textDecoration: 'none', padding: '6px 14px', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
          {locale === 'en' ? 'العربية' : 'English'}
        </Link>
      </div>
    </header>
  );
}
