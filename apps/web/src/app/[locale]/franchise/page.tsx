import type { Metadata } from 'next';

interface FranchisePageProps { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: FranchisePageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'ar' ? 'الامتياز التجاري' : 'Franchise',
    description: locale === 'ar' ? 'انضم إلى عائلة ميلستونز كوفي وافتح فرعك' : 'Join the Milestones Coffee family and open your own branch.',
  };
}

const benefits = [
  { icon: '🏷️', en: { title: 'Established Brand', desc: 'Leverage a trusted UAE coffee brand with loyal customers across Abu Dhabi.' }, ar: { title: 'علامة تجارية راسخة', desc: 'استفد من علامة تجارية إماراتية موثوقة بقاعدة عملاء وفية في أبوظبي.' } },
  { icon: '📋', en: { title: 'Full Support', desc: 'From site selection to staff training, we support you at every step.' }, ar: { title: 'دعم كامل', desc: 'من اختيار الموقع إلى تدريب الموظفين، نساندك في كل خطوة.' } },
  { icon: '☕', en: { title: 'Proven System', desc: 'A tested operational model, supply chain, and quality standards ready to scale.' }, ar: { title: 'نظام مجرّب', desc: 'نموذج تشغيلي مختبر وسلسلة توريد ومعايير جودة جاهزة للتوسع.' } },
  { icon: '📈', en: { title: 'Growing Market', desc: 'The UAE specialty coffee market is growing — get in at the right time.' }, ar: { title: 'سوق في نمو', desc: 'سوق القهوة المتخصصة في الإمارات في تنامٍ مستمر — انضم في الوقت المناسب.' } },
];

export default async function FranchisePage({ params }: FranchisePageProps) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return (
    <main style={{ minHeight: '70vh' }}>
      {/* Hero */}
      <section style={{ background: 'var(--color-brand-espresso)', color: 'var(--color-brand-ivory)', padding: 'var(--spacing-2xl) var(--spacing-xl)', textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 800, marginBottom: 'var(--spacing-lg)' }}>
            {isAr ? 'افتح فرعك معنا' : 'Open a Franchise'}
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
            {isAr
              ? 'انضم إلى عائلة ميلستونز كوفي وكن جزءاً من قصة نجاح إماراتية حقيقية'
              : 'Join the Milestones Coffee family and be part of a genuine UAE success story'}
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: 'var(--spacing-2xl) var(--spacing-xl)', maxWidth: '1280px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', marginBottom: 'var(--spacing-2xl)', color: 'var(--color-brand-espresso)' }}>
          {isAr ? 'لماذا ميلستونز؟' : 'Why Milestones?'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-2xl)' }}>
          {benefits.map((b) => {
            const c = isAr ? b.ar : b.en;
            return (
              <div key={b.icon} style={{ background: 'var(--color-surface-raised)', borderRadius: '16px', padding: 'var(--spacing-xl)', borderTop: '4px solid var(--color-brand-gold)' }}>
                <p style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)' }}>{b.icon}</p>
                <h3 style={{ fontWeight: 700, marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>{c.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{c.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Enquiry Form */}
        <div style={{ background: 'var(--color-surface-raised)', borderRadius: '16px', padding: 'var(--spacing-2xl)', maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 'var(--spacing-xl)', color: 'var(--color-brand-espresso)', textAlign: 'center' }}>
            {isAr ? 'أرسل استفساراً' : 'Send an Enquiry'}
          </h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
              {[{ label: isAr ? 'الاسم الكامل' : 'Full Name', type: 'text', ph: isAr ? 'اسمك الكامل' : 'Your name' },
                { label: isAr ? 'البريد الإلكتروني' : 'Email', type: 'email', ph: 'you@example.com' }].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            {[{ label: isAr ? 'رقم الهاتف' : 'Phone', type: 'tel', ph: '+971 XX XXX XXXX' },
              { label: isAr ? 'الإمارة / المدينة المفضّلة' : 'Preferred Emirate / City', type: 'text', ph: isAr ? 'مثال: أبوظبي' : 'e.g. Abu Dhabi' }].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>{f.label}</label>
                <input type={f.type} placeholder={f.ph} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>{isAr ? 'رسالتك' : 'Message'}</label>
              <textarea rows={4} placeholder={isAr ? 'أخبرنا عن نفسك وخبرتك التجارية...' : 'Tell us about yourself and your business experience...'} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ background: 'var(--color-brand-espresso)', color: 'var(--color-brand-ivory)', border: 'none', borderRadius: '8px', padding: '14px 32px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
              {isAr ? 'إرسال الاستفسار' : 'Submit Enquiry'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
