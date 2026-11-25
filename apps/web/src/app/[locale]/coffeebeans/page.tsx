import type { Metadata } from 'next';
import { BeansBrowser } from '@/components/beans/beans-browser';
import { BEANS } from '@/lib/beans';

interface CoffeeBeansPageProps { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: CoffeeBeansPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'ar' ? 'حبوب القهوة' : 'Coffee Beans',
    description: locale === 'ar' ? 'حبوب قهوة ميلستونز — محمصة طازجة بعناية فائقة' : 'Milestones Coffee Beans — freshly roasted with premium quality.',
  };
}

export default async function CoffeeBeansPage({ params }: CoffeeBeansPageProps) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  const lang = isAr ? 'ar' : 'en';
  const hasPlaceholders = BEANS.some((b) => b.placeholder);
  return (
    <main style={{ minHeight: '70vh', padding: 'var(--spacing-2xl) clamp(16px, 4vw, var(--spacing-xl))', maxWidth: '1280px', margin: '0 auto', overflowX: 'clip' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>{isAr ? 'حبوب القهوة' : 'Coffee Beans'}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '600px' }}>
          {isAr ? 'نختار حبوبنا بعناية من أفضل مزارع العالم، ونحمصها طازجة لضمان أعلى جودة في كل فنجان.' : "We carefully source our beans from the world's finest farms and roast them fresh to ensure the highest quality in every cup."}
        </p>
        {hasPlaceholders && (
          <p role="note" style={{ marginTop: 'var(--spacing-md)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-warning)' }}>
            {isAr
              ? '[نص تجريبي — PLACEHOLDER] تفاصيل المصدر والنكهة وطرق التحضير أدناه مؤقتة حتى اعتمادها من الفريق.'
              : '[PLACEHOLDER] Origin, flavour and brewing details below are sample content until confirmed by our roasters.'}
          </p>
        )}
      </div>

      <BeansBrowser lang={lang} />

      <div style={{ background: 'var(--color-brand-espresso)', borderRadius: '16px', padding: 'var(--spacing-2xl) var(--spacing-lg)', textAlign: 'center', color: 'var(--color-brand-ivory)', marginTop: 'var(--spacing-2xl)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>{isAr ? 'هل تريد القهوة في منزلك؟' : 'Want Our Coffee at Home?'}</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 'var(--spacing-xl)' }}>{isAr ? 'تفضل بزيارة أقرب فرع لنا لاقتناء حبوب القهوة الطازجة' : 'Visit your nearest branch to pick up freshly roasted beans.'}</p>
        <a href={`/${locale}/locations`} style={{ display: 'inline-block', background: 'var(--color-brand-bronze-light)', color: 'var(--color-brand-espresso)', padding: '14px 32px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
          {isAr ? 'ابحث عن فرع' : 'Find a Branch'}
        </a>
      </div>
    </main>
  );
}
