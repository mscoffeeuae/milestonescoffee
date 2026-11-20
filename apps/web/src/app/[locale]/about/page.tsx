import type { Metadata } from 'next';

interface AboutPageProps { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'ar' ? 'من نحن' : 'About Us',
    description: locale === 'ar' ? 'تعرّف على قصة ميلستونز كوفي وقيمنا' : 'Learn about the story and values behind Milestones Coffee.',
  };
}

const values = [
  { icon: '☕', en: { title: 'Quality First', desc: 'Every cup is crafted with precision, using only the finest beans sourced from the world\'s best farms.' }, ar: { title: 'الجودة أولاً', desc: 'كل فنجان يُصنع بدقة باستخدام أجود الحبوب من أفضل مزارع العالم.' } },
  { icon: '🌍', en: { title: 'Community', desc: 'We are more than a coffee shop — we are a gathering place for Abu Dhabi\'s diverse community.' }, ar: { title: 'المجتمع', desc: 'نحن أكثر من مجرد مقهى — نحن مكان تجمّع لمجتمع أبوظبي المتنوع.' } },
  { icon: '🌱', en: { title: 'Sustainability', desc: 'From our sourcing to our packaging, we are committed to minimizing our environmental footprint.' }, ar: { title: 'الاستدامة', desc: 'من مصادر حبوبنا إلى تغليفنا، نلتزم بتقليل أثرنا البيئي.' } },
  { icon: '✨', en: { title: 'Innovation', desc: 'We continuously evolve our menu and experience, blending tradition with modern coffee culture.' }, ar: { title: 'الابتكار', desc: 'نطوّر قائمتنا وتجربتنا باستمرار، دامجين التقاليد مع ثقافة القهوة الحديثة.' } },
];

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return (
    <main style={{ minHeight: '70vh' }}>
      {/* Hero */}
      <section style={{ background: 'var(--color-brand-espresso)', color: 'var(--color-brand-ivory)', padding: 'var(--spacing-2xl) var(--spacing-xl)', textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 800, marginBottom: 'var(--spacing-lg)' }}>
            {isAr ? 'قصتنا' : 'Our Story'}
          </h1>
          <p style={{ fontSize: '1.2rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
            {isAr
              ? 'ميلستونز كوفي — رحلة بدأت بشغف واحد: تقديم قهوة استثنائية في قلب أبوظبي.'
              : 'Milestones Coffee — a journey that began with one passion: serving exceptional coffee in the heart of Abu Dhabi.'}
          </p>
        </div>
      </section>

      {/* Story */}
      <section style={{ padding: 'var(--spacing-2xl) var(--spacing-xl)', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2xl)', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 'var(--spacing-lg)', color: 'var(--color-brand-espresso)' }}>
              {isAr ? 'من نحن' : 'Who We Are'}
            </h2>
            <p style={{ lineHeight: 1.9, color: 'var(--color-text-body)', marginBottom: 'var(--spacing-lg)' }}>
              {isAr
                ? 'ميلستونز كوفي هي سلسلة مقاهي إماراتية تأسست في أبوظبي بهدف رفع مستوى تجربة القهوة المحلية. منذ افتتاح أول فرع لنا، نسعى دائماً إلى تقديم أفضل أنواع القهوة المحضّرة بمهارة واحترافية عالية.'
                : 'Milestones Coffee is a UAE-based coffee chain founded in Abu Dhabi with the goal of elevating the local coffee experience. Since opening our first branch, we have been dedicated to serving the finest specialty coffee, crafted with skill and passion.'}
            </p>
            <p style={{ lineHeight: 1.9, color: 'var(--color-text-body)' }}>
              {isAr
                ? 'اليوم، نضم عدة فروع في مناطق مختلفة من أبوظبي، ونواصل رحلة نمونا لنكون الوجهة الأولى لعشاق القهوة في الإمارات.'
                : 'Today, we operate multiple branches across Abu Dhabi, continuing our journey to become the premier destination for coffee lovers across the UAE.'}
            </p>
          </div>
          <div style={{ background: 'var(--color-surface-raised)', borderRadius: '16px', padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
            <p style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>☕</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
              {[['4+', isAr ? 'فروع' : 'Branches'], ['2021', isAr ? 'تأسست' : 'Founded'], ['100%', isAr ? 'حبوب طازجة' : 'Fresh Beans'], ['⭐', isAr ? 'تقييم عالي' : 'Top Rated']].map(([num, label]) => (
                <div key={label}>
                  <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-brand-gold)' }}>{num}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: 'var(--color-surface-raised)', padding: 'var(--spacing-2xl) var(--spacing-xl)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', marginBottom: 'var(--spacing-2xl)', color: 'var(--color-brand-espresso)' }}>
            {isAr ? 'قيمنا' : 'Our Values'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-xl)' }}>
            {values.map((v) => {
              const content = isAr ? v.ar : v.en;
              return (
                <div key={v.icon} style={{ background: 'white', borderRadius: '16px', padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                  <p style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)' }}>{v.icon}</p>
                  <h3 style={{ fontWeight: 700, marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>{content.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{content.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
