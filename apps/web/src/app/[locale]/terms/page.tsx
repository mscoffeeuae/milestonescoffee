import type { Metadata } from 'next';

interface TermsPageProps { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions' };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return (
    <main style={{ minHeight: '70vh', padding: 'var(--spacing-2xl) var(--spacing-xl)', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2xl)', fontSize: '0.9rem' }}>{isAr ? 'آخر تحديث: نوفمبر ٢٠٢٦' : 'Last updated: November 2026'}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', lineHeight: 1.8, color: 'var(--color-text-body)' }}>
        {isAr ? (
          <>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>١. القبول بالشروط</h2><p>باستخدامك لموقع ميلستونز كوفي، فإنك توافق على الالتزام بهذه الشروط والأحكام.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>٢. استخدام الموقع</h2><p>يُتاح هذا الموقع للاستخدام الشخصي غير التجاري فقط.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>٣. الملكية الفكرية</h2><p>جميع المحتويات الموجودة على هذا الموقع هي ملك لميلستونز كوفي ومحمية بموجب قوانين الملكية الفكرية.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>٤. تحديد المسؤولية</h2><p>لا تتحمل ميلستونز كوفي أي مسؤولية عن أي أضرار ناتجة عن استخدام الموقع.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>٥. القانون المطبق</h2><p>تخضع هذه الشروط لقوانين دولة الإمارات العربية المتحدة.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>٦. التواصل معنا</h2><p><a href="mailto:info@milestonescoffee.ae" style={{ color: 'var(--color-brand-gold)' }}>info@milestonescoffee.ae</a></p></section>
          </>
        ) : (
          <>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>1. Acceptance of Terms</h2><p>By using the Milestones Coffee website, you agree to be bound by these Terms and Conditions.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>2. Use of Website</h2><p>This website is made available for personal, non-commercial use only.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>3. Intellectual Property</h2><p>All content on this website, including text, images, and logos, is the property of Milestones Coffee and protected by applicable intellectual property laws.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>4. Limitation of Liability</h2><p>Milestones Coffee shall not be liable for any direct or indirect damages resulting from the use of this website.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>5. Orders & Payments</h2><p>All prices are listed in UAE Dirhams (AED) inclusive of applicable VAT. Milestones Coffee reserves the right to modify prices without prior notice.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>6. Governing Law</h2><p>These terms are governed by the laws of the United Arab Emirates.</p></section>
            <section><h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-sm)' }}>7. Contact Us</h2><p><a href="mailto:info@milestonescoffee.ae" style={{ color: 'var(--color-brand-gold)' }}>info@milestonescoffee.ae</a></p></section>
          </>
        )}
      </div>
    </main>
  );
}
