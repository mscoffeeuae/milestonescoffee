import type { Metadata } from 'next';

interface ContactPageProps { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'ar' ? 'تواصل معنا' : 'Contact Us',
    description: locale === 'ar' ? 'تواصل مع ميلستونز كوفي' : 'Get in touch with Milestones Coffee.',
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return (
    <main style={{ minHeight: '70vh', padding: 'var(--spacing-2xl) var(--spacing-xl)', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>
        {isAr ? 'تواصل معنا' : 'Contact Us'}
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2xl)', fontSize: '1.1rem' }}>
        {isAr ? 'نسعد بسماعك — تواصل معنا عبر أي من القنوات أدناه' : "We'd love to hear from you — reach us through any of the channels below."}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-2xl)' }}>
        <div style={{ background: 'var(--color-surface-raised)', borderRadius: '12px', padding: 'var(--spacing-xl)' }}>
          <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>{isAr ? '📞 الهاتف' : '📞 Phone'}</p>
          <a href="tel:+97126410062" style={{ color: 'var(--color-brand-gold)', textDecoration: 'none', fontSize: '1.1rem' }}>+971 2 641 0062</a>
        </div>
        <div style={{ background: 'var(--color-surface-raised)', borderRadius: '12px', padding: 'var(--spacing-xl)' }}>
          <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>{isAr ? '✉️ البريد الإلكتروني' : '✉️ Email'}</p>
          <a href="mailto:info@milestonescoffee.ae" style={{ color: 'var(--color-brand-gold)', textDecoration: 'none', fontSize: '1.1rem' }}>info@milestonescoffee.ae</a>
        </div>
        <div style={{ background: 'var(--color-surface-raised)', borderRadius: '12px', padding: 'var(--spacing-xl)' }}>
          <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>{isAr ? '📱 تابعنا' : '📱 Follow Us'}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <a href="https://www.facebook.com/milestones.coffee2021" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-brand-gold)', textDecoration: 'none' }}>Facebook</a>
            <a href="https://www.instagram.com/milestones_coffee/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-brand-gold)', textDecoration: 'none' }}>Instagram</a>
          </div>
        </div>
      </div>
      <div style={{ background: 'var(--color-surface-raised)', borderRadius: '16px', padding: 'var(--spacing-2xl)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--spacing-xl)', color: 'var(--color-brand-espresso)' }}>{isAr ? 'أرسل لنا رسالة' : 'Send Us a Message'}</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>{isAr ? 'الاسم' : 'Name'}</label>
              <input type="text" placeholder={isAr ? 'اسمك الكامل' : 'Your full name'} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
              <input type="email" placeholder={isAr ? 'بريدك الإلكتروني' : 'your@email.com'} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>{isAr ? 'الموضوع' : 'Subject'}</label>
            <input type="text" placeholder={isAr ? 'موضوع الرسالة' : 'How can we help?'} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>{isAr ? 'الرسالة' : 'Message'}</label>
            <textarea rows={5} placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Write your message here...'} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ alignSelf: 'flex-start', background: 'var(--color-brand-espresso)', color: 'var(--color-brand-ivory)', border: 'none', borderRadius: '8px', padding: '14px 32px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
            {isAr ? 'إرسال' : 'Send Message'}
          </button>
        </form>
      </div>
    </main>
  );
}
