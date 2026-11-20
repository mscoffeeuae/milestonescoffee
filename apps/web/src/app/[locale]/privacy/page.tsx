import type { Metadata } from 'next';

interface PrivacyPageProps { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy' };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return (
    <main style={{ minHeight: '70vh', padding: 'var(--spacing-2xl) var(--spacing-xl)', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2xl)', fontSize: '0.9rem' }}>{isAr ? 'آخر تحديث: نوفمبر ٢٠٢٦' : 'Last updated: November 2026'}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', lineHeight: 1.8, color: 'var(--color-text-body)' }}>
        {isAr ? (
          <>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>١. المعلومات التي نجمعها</h2><p>نجمع المعلومات التي تقدمها لنا مباشرة، مثل الاسم وعنوان البريد الإلكتروني ورقم الهاتف عند التسجيل أو التواصل معنا.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>٢. كيف نستخدم معلوماتك</h2><p>نستخدم معلوماتك لتقديم خدماتنا وتحسينها، ومعالجة الطلبات، وإرسال التحديثات والعروض الترويجية (بموافقتك).</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>٣. مشاركة المعلومات</h2><p>لا نبيع معلوماتك الشخصية لأطراف ثالثة. قد نشارك المعلومات مع مزودي الخدمات الموثوقين.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>٤. ملفات تعريف الارتباط</h2><p>يستخدم موقعنا ملفات تعريف الارتباط لتحسين تجربتك.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>٥. التواصل معنا</h2><p>لأي استفسارات: <a href="mailto:info@milestonescoffee.ae" style={{ color: 'var(--color-brand-gold)' }}>info@milestonescoffee.ae</a></p></section>
          </>
        ) : (
          <>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>1. Information We Collect</h2><p>We collect information you provide directly to us, such as your name, email address, and phone number when you register or contact us.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>2. How We Use Your Information</h2><p>We use your information to provide and improve our services, process orders, send updates and promotions (with your consent), and respond to your inquiries.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>3. Information Sharing</h2><p>We do not sell your personal information to third parties. We may share information with trusted service providers who assist us in operating our website.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>4. Cookies</h2><p>Our website uses cookies to improve your experience. You can set your browser to refuse cookies, but this may affect some functionality.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>5. Data Retention</h2><p>We retain your personal data only as long as necessary to fulfill the purposes outlined in this policy or as required by UAE law.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>6. Contact Us</h2><p>For any privacy-related questions: <a href="mailto:info@milestonescoffee.ae" style={{ color: 'var(--color-brand-gold)' }}>info@milestonescoffee.ae</a></p></section>
          </>
        )}
      </div>
    </main>
  );
}
