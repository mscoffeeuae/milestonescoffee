import { notFound } from 'next/navigation';
import type { Locale } from '@milestones/contracts';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { BRANCHES_FALLBACK } from '@/lib/branches-fallback';
import { sanityFetch } from '@/lib/sanity/client';
import { BRANCHES_QUERY, FEATURED_PRODUCTS_QUERY, OFFERS_QUERY } from '@/lib/sanity/queries';
import { OpenNowBanner } from '@/components/home/open-now-banner';
import type { OpeningHours } from '@/components/locations/branch-status';
import { CateringCta, FaqSection, FeaturedDrinks, OfferBanner, type FeaturedProduct, type HomeOffer } from '@/components/home/home-sections';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const supportedLocales: Locale[] = ['en', 'ar'];

// CMS-driven sections refresh every 5 minutes without a redeploy.
export const revalidate = 300;

// Motion + layout for the homepage. Reduced-motion users get static visuals.
const CSS = `
.ms-home-hero { position: relative; overflow: hidden; background:
  radial-gradient(circle at 15% 20%, rgba(201,168,124,.35) 0, transparent 40%),
  radial-gradient(circle at 85% 80%, rgba(160,120,74,.35) 0, transparent 45%),
  linear-gradient(160deg, #F5F0E8 0%, #EDE3D3 100%); }
.ms-home-grid { display: grid; gap: 2.5rem; align-items: center; grid-template-columns: 1fr; }
@media (min-width: 900px) { .ms-home-grid { grid-template-columns: 1.1fr .9fr; } }
.ms-bean { position: absolute; width: 36px; height: 52px; opacity: .18; animation: ms-float 9s ease-in-out infinite; }
.ms-steam path { stroke-dasharray: 40; animation: ms-steam 3.2s ease-in-out infinite; }
.ms-steam path:nth-child(2) { animation-delay: 1s; }
.ms-steam path:nth-child(3) { animation-delay: 2s; }
.ms-cup { animation: ms-bob 6s ease-in-out infinite; }
.ms-fade { animation: ms-rise .9s ease-out both; }
.ms-card { transition: transform .25s ease, box-shadow .25s ease; }
.ms-card:hover { transform: translateY(-4px); box-shadow: 0 14px 30px rgba(59,31,14,.15); }
.ms-stat-n { font-variant-numeric: tabular-nums; }
@keyframes ms-float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-18px) rotate(12deg); } }
@keyframes ms-steam { 0% { stroke-dashoffset: 40; opacity: 0; transform: translateY(6px); } 40% { opacity: .9; } 100% { stroke-dashoffset: -40; opacity: 0; transform: translateY(-14px); } }
@keyframes ms-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes ms-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .ms-bean, .ms-steam path, .ms-cup, .ms-fade { animation: none !important; }
  .ms-card:hover { transform: none; }
}
`;

const Bean = ({ style, rot }: { style: React.CSSProperties; rot: number }) => (
  <svg aria-hidden className="ms-bean" style={style} viewBox="0 0 36 52">
    <ellipse cx="18" cy="26" rx="15" ry="22" transform={`rotate(${rot} 18 26)`} fill="#3B1F0E" />
    <path d="M18 6 C10 22, 26 30, 18 46" transform={`rotate(${rot} 18 26)`} stroke="#C9A87C" strokeWidth="2.5" fill="none" />
  </svg>
);

function CupIllustration() {
  return (
    <svg viewBox="0 0 320 300" role="img" aria-label="Illustration of a coffee cup with rising steam" style={{ width: '100%', maxWidth: 360, height: 'auto' }}>
      <defs>
        <linearGradient id="ms-cup-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A0784A" />
          <stop offset="1" stopColor="#3B1F0E" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="268" rx="120" ry="14" fill="#3B1F0E" opacity=".15" />
      <g className="ms-steam" fill="none" stroke="#A0784A" strokeWidth="5" strokeLinecap="round">
        <path d="M120 110 C100 80, 140 60, 120 30" />
        <path d="M160 110 C140 75, 180 55, 160 20" />
        <path d="M200 110 C180 80, 220 60, 200 30" />
      </g>
      <g className="ms-cup">
        <path d="M70 120 H250 V190 C250 240, 215 262, 160 262 C105 262, 70 240, 70 190 Z" fill="url(#ms-cup-g)" />
        <path d="M250 140 C300 140, 300 210, 248 210" fill="none" stroke="#3B1F0E" strokeWidth="14" strokeLinecap="round" />
        <rect x="62" y="112" width="196" height="16" rx="8" fill="#C9A87C" />
        <ellipse cx="160" cy="120" rx="98" ry="10" fill="#3B1F0E" />
        <ellipse cx="160" cy="122" rx="78" ry="6" fill="#5A3520" />
        <text x="160" y="205" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fill="#F5F0E8" letterSpacing="2">MILESTONES</text>
      </g>
    </svg>
  );
}

const Icon = ({ d }: { d: string }) => (
  <svg aria-hidden viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#3B1F0E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  if (!supportedLocales.includes(locale as Locale)) notFound();
  const isAr = locale === 'ar';
  const branchCount = BRANCHES_FALLBACK.length;
  const emirateCount = new Set(BRANCHES_FALLBACK.map((b) => b.emirate)).size;

  const [cmsBranches, featured, offers] = await Promise.all([
    sanityFetch<{ openingHours: OpeningHours | null }[]>(BRANCHES_QUERY),
    sanityFetch<FeaturedProduct[]>(FEATURED_PRODUCTS_QUERY),
    sanityFetch<HomeOffer[]>(OFFERS_QUERY),
  ]);
  // Same CMS-first / fallback rule as the locations page.
  const hoursList = (cmsBranches && cmsBranches.length > 0 ? cmsBranches : (BRANCHES_FALLBACK as { openingHours: OpeningHours | null }[])).map((b) => b.openingHours ?? null);
  const offer = offers?.[0] ?? null;
  const featuredProducts = featured ?? [];

  const cards = [
    {
      href: `/${locale}/menu`,
      title: isAr ? 'القائمة' : 'Our Menu',
      body: isAr ? 'مشروبات ومخبوزات، مع الأسعار والمكونات المسببة للحساسية.' : 'Drinks and bakes, with prices and allergen info.',
      icon: 'M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z M17 10h1.5a2.5 2.5 0 0 1 0 5H17 M8 3v2 M12 3v2',
    },
    {
      href: `/${locale}/locations`,
      title: isAr ? 'فروعنا' : 'Find a Branch',
      body: isAr ? 'اعرف الفرع الأقرب إليك وساعات عمله الآن.' : 'Find your nearest branch and whether it is open now.',
      icon: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    },
    {
      href: `/${locale}/menu`,
      title: isAr ? 'قهوة مختصة' : 'Specialty Coffee',
      body: isAr ? 'حبوب مختارة وتحميص يومي بعناية.' : 'Carefully selected beans, roasted with care.',
      icon: 'M12 3c3 3.5 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5.5 5-9Z',
    },
  ];

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        {isAr ? 'انتقل إلى المحتوى الرئيسي' /* [PLACEHOLDER] */ : 'Skip to main content'}
      </a>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <SiteHeader locale={locale as Locale} />
      <OpenNowBanner hours={hoursList} locale={locale} />
      {offer && <OfferBanner offer={offer} locale={locale} />}
      <main id="main-content">
        {/* Hero */}
        <section aria-label={isAr ? 'القسم الرئيسي' /* [PLACEHOLDER] */ : 'Hero'} className="ms-home-hero" style={{ padding: 'clamp(3rem, 8vw, 6rem) var(--spacing-xl)' }}>
          <Bean style={{ top: '12%', left: '6%' }} rot={20} />
          <Bean style={{ bottom: '14%', left: '46%', animationDelay: '-3s' }} rot={-30} />
          <Bean style={{ top: '18%', right: '8%', animationDelay: '-5s' }} rot={60} />
          <div className="container mx-auto ms-home-grid" style={{ position: 'relative', maxWidth: 1100 }}>
            <div className="ms-fade" style={{ textAlign: isAr ? 'right' : 'left' }}>
              <p style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-brand-bronze)', marginBottom: 'var(--spacing-md)', fontWeight: 600 }}>
                {isAr ? 'علامة إماراتية أصيلة' /* [PLACEHOLDER] */ : 'A Proud Emirati Brand'}
              </p>
              <h1 style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4rem)', fontFamily: 'var(--font-heading)', color: 'var(--color-brand-espresso)', margin: '0 0 var(--spacing-lg)', lineHeight: 1.1 }}>
                {isAr ? 'ميلستونز كوفي' /* [PLACEHOLDER] */ : 'Milestones Coffee'}
              </h1>
              <p style={{ fontSize: 'clamp(1rem, 2.4vw, 1.2rem)', color: 'var(--color-text-secondary)', maxWidth: 560, marginBottom: 'var(--spacing-2xl)', lineHeight: 1.7 }}>
                {isAr
                  ? '[PLACEHOLDER — يتطلب نسخة معتمدة من فريق التسويق]'
                  : "Looking for the best coffee shop in Abu Dhabi? Check out Milestones Coffee — with branches across the emirates, we're bringing you specialty coffee rooted in Emirati heritage."}
              </p>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                <a href={`/${locale}/menu`} className="ms-btn ms-btn-primary">
                  {isAr ? 'القائمة' /* [PLACEHOLDER] */ : 'View Menu'}
                </a>
                <a href={`/${locale}/locations`} className="ms-btn ms-btn-secondary">
                  {isAr ? 'فروعنا' /* [PLACEHOLDER] */ : 'Find a Branch'}
                </a>
              </div>
            </div>
            <div className="ms-fade" style={{ display: 'flex', justifyContent: 'center', animationDelay: '.15s' }}>
              <CupIllustration />
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section aria-label={isAr ? 'أرقام' : 'Highlights'} style={{ background: 'var(--color-brand-espresso)', color: 'var(--color-brand-ivory)' }}>
          <dl className="container mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--spacing-lg)', padding: 'var(--spacing-xl) var(--spacing-lg)', margin: 0, textAlign: 'center' }}>
            {[
              [String(branchCount), isAr ? 'فرع' : 'Branches'],
              [String(emirateCount), isAr ? 'إمارات' : 'Emirates'],
              ['☕', isAr ? 'مشروبات يومية' : 'Fresh drinks daily'],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="ms-stat-n" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-brand-bronze-light, #C9A87C)', fontFamily: 'var(--font-heading)' }}>{n}</dt>
                <dd style={{ margin: 0, fontSize: '0.875rem', opacity: 0.85 }}>{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {featuredProducts.length > 0 && <FeaturedDrinks products={featuredProducts} locale={locale} />}

        {/* Feature cards */}
        <section aria-labelledby="home-features" className="container mx-auto" style={{ padding: 'clamp(3rem, 7vw, 5rem) var(--spacing-lg)' }}>
          <h2 id="home-features" style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-2xl)' }}>
            {isAr ? 'ابدأ من هنا' /* [PLACEHOLDER] */ : 'Start here'}
          </h2>
          <ul role="list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-xl)', listStyle: 'none', padding: 0, margin: 0 }}>
            {cards.map((c) => (
              <li key={c.title}>
                <a href={c.href} className="ms-card ms-surface ms-pad" style={{ display: 'block', height: '100%', textDecoration: 'none', color: 'inherit' }}>
                  <span style={{ display: 'inline-flex', width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', background: 'var(--color-brand-ivory)', marginBottom: '1rem' }}>
                    <Icon d={c.icon} />
                  </span>
                  <h3 style={{ margin: '0 0 .5rem', fontSize: '1.25rem', color: 'var(--color-brand-espresso)' }}>{c.title}</h3>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{c.body}</p>
                  <span style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--color-brand-bronze)', fontWeight: 600 }}>{isAr ? 'اكتشف ←' : 'Explore →'}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Find-branch band */}
        <section aria-labelledby="home-band" style={{ margin: '0 var(--spacing-lg) clamp(3rem, 7vw, 5rem)', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(120deg, #3B1F0E 0%, #A0784A 100%)', color: '#fff', position: 'relative' }}>
          <Bean style={{ top: 10, right: 30, opacity: .12 }} rot={15} />
          <div className="container mx-auto" style={{ padding: 'clamp(2rem, 5vw, 3.5rem)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', position: 'relative' }}>
            <div>
              <h2 id="home-band" style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
                {isAr ? 'اعثر على أقرب فرع إليك' /* [PLACEHOLDER] */ : 'Find the branch nearest you'}
              </h2>
              <p style={{ margin: '.5rem 0 0', opacity: .9 }}>
                {isAr ? 'حدّد موقعك وشاهد الفروع المفتوحة الآن على الخريطة.' : 'Share your location to see the closest branches and which are open now.'}
              </p>
            </div>
            <a href={`/${locale}/locations`} style={{ display: 'inline-flex', padding: '0.9rem 2rem', background: '#fff', color: 'var(--color-brand-espresso)', textDecoration: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
              {isAr ? 'عرض الفروع' /* [PLACEHOLDER] */ : 'See all branches'}
            </a>
          </div>
        </section>

        <CateringCta locale={locale} />
        <FaqSection locale={locale} />
      </main>
      <SiteFooter locale={locale as Locale} />
    </>
  );
}
