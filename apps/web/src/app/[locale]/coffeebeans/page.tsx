import type { Metadata } from 'next';

interface CoffeeBeansPageProps { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: CoffeeBeansPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'ar' ? 'حبوب القهوة' : 'Coffee Beans',
    description: locale === 'ar' ? 'حبوب قهوة ميلستونز — محمصة طازجة بعناية فائقة' : 'Milestones Coffee Beans — freshly roasted with premium quality.',
  };
}

const beans = [
  { name: { en: 'Signature Blend', ar: 'الخلطة المميزة' }, origin: { en: 'Ethiopia & Colombia', ar: 'إثيوبيا وكولومبيا' }, roast: { en: 'Medium', ar: 'تحميص متوسط' }, notes: { en: 'Chocolate, caramel, citrus', ar: 'شوكولاتة، كراميل، حمضيات' }, emoji: '☕' },
  { name: { en: 'Dark Roast', ar: 'التحميص الغامق' }, origin: { en: 'Brazil', ar: 'البرازيل' }, roast: { en: 'Dark', ar: 'تحميص غامق' }, notes: { en: 'Bold, smoky, nutty', ar: 'قوي، دخاني، مكسرات' }, emoji: '🫘' },
  { name: { en: 'Single Origin', ar: 'المصدر الواحد' }, origin: { en: 'Yemen', ar: 'اليمن' }, roast: { en: 'Light', ar: 'تحميص خفيف' }, notes: { en: 'Floral, fruity, honey', ar: 'زهري، فاكهي، عسل' }, emoji: '🌸' },
];

export default async function CoffeeBeansPage({ params }: CoffeeBeansPageProps) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  const lang = isAr ? 'ar' : 'en';
  return (
    <main style={{ minHeight: '70vh', padding: 'var(--spacing-2xl) var(--spacing-xl)', maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>{isAr ? 'حبوب القهوة' : 'Coffee Beans'}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '600px' }}>
          {isAr ? 'نختار حبوبنا بعناية من أفضل مزارع العالم، ونحمصها طازجة لضمان أعلى جودة في كل فنجان.' : "We carefully source our beans from the world's finest farms and roast them fresh to ensure the highest quality in every cup."}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-2xl)' }}>
        {beans.map((bean, i) => (
          <div key={i} style={{ background: 'var(--color-surface-raised)', borderRadius: '16px', padding: 'var(--spacing-xl)', borderTop: '4px solid var(--color-brand-gold)' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)' }}>{bean.emoji}</p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>{bean.name[lang]}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <p><strong>{isAr ? 'المصدر:' : 'Origin:'}</strong> {bean.origin[lang]}</p>
              <p><strong>{isAr ? 'التحميص:' : 'Roast:'}</strong> {bean.roast[lang]}</p>
              <p><strong>{isAr ? 'النكهات:' : 'Tasting Notes:'}</strong> {bean.notes[lang]}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--color-brand-espresso)', borderRadius: '16px', padding: 'var(--spacing-2xl)', textAlign: 'center', color: 'var(--color-brand-ivory)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>{isAr ? 'هل تريد القهوة في منزلك؟' : 'Want Our Coffee at Home?'}</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 'var(--spacing-xl)' }}>{isAr ? 'تفضل بزيارة أقرب فرع لنا لاقتناء حبوب القهوة الطازجة' : 'Visit your nearest branch to pick up freshly roasted beans.'}</p>
        <a href={`/${locale}/locations`} style={{ display: 'inline-block', background: 'var(--color-brand-gold)', color: 'var(--color-brand-espresso)', padding: '14px 32px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
          {isAr ? 'ابحث عن فرع' : 'Find a Branch'}
        </a>
      </div>
    </main>
  );
}
