/** Server-rendered homepage sections: featured drinks, offer banner, catering CTA, FAQ. */
import { CmsImage, type CmsImageSource } from '@/components/media/cms-image';


export interface FeaturedProduct {
  _id: string;
  nameEn: string;
  nameAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  displayPriceAed: number | null;
  isNew: boolean | null;
  productImage: CmsImageSource | null;
  productImageThumb?: CmsImageSource | null;
}

export interface HomeOffer {
  _id: string;
  titleEn: string;
  titleAr: string | null;
  summaryEn: string | null;
  summaryAr: string | null;
}

const H2 = { textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--color-brand-espresso)', marginBottom: 'var(--spacing-2xl)' } as const;

export function OfferBanner({ offer, locale }: { offer: HomeOffer; locale: string }) {
  const isAr = locale === 'ar';
  const title = (isAr && offer.titleAr) || offer.titleEn;
  const summary = isAr ? offer.summaryAr || offer.summaryEn : offer.summaryEn;
  return (
    <section aria-label={isAr ? 'عرض' : 'Offer'} style={{ background: 'var(--color-brand-bronze-light)', color: 'var(--color-brand-espresso)' }}>
      <div className="container mx-auto" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'center' }}>
        <strong style={{ fontSize: '1.05rem' }}>{title}</strong>
        {summary && <span style={{ display: 'block', marginTop: 'var(--spacing-xs)', fontSize: '0.9rem' }}>{summary}</span>}
      </div>
    </section>
  );
}

export function FeaturedDrinks({ products, locale }: { products: FeaturedProduct[]; locale: string }) {
  const isAr = locale === 'ar';
  return (
    <section aria-labelledby="home-featured" className="container mx-auto" style={{ padding: 'clamp(3rem, 7vw, 5rem) var(--spacing-lg) 0' }}>
      <h2 id="home-featured" style={H2}>{isAr ? 'مختارات من قائمتنا' : 'Featured from our menu'}</h2>
      <ul role="list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)', listStyle: 'none', padding: 0, margin: 0 }}>
        {products.map((p) => {
          const name = (isAr && p.nameAr) || p.nameEn;
          const desc = isAr ? p.descriptionAr || p.descriptionEn : p.descriptionEn;
          return (
            <li key={p._id}>
              <a href={`/${locale}/menu`} className="ms-card ms-surface" style={{ display: 'block', height: '100%', overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ aspectRatio: '4 / 3', background: 'var(--color-bg-muted)' }}>
                  {/* Featured row is a list of small cards, so it uses the 600px thumbnail. */}
                  <CmsImage
                    image={p.productImageThumb?.asset?.url ? p.productImageThumb : p.productImage}
                    alt=""
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="block h-full w-full object-cover"
                  />
                </div>
                <div style={{ padding: 'var(--spacing-md)' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-brand-espresso)' }}>
                    {name}
                    {p.isNew && (
                      <span style={{ marginInlineStart: 'var(--spacing-sm)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-brand-bronze)', textTransform: 'uppercase' }}>
                        {isAr ? 'جديد' : 'New'}
                      </span>
                    )}
                  </h3>
                  {desc && (
                    <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</p>
                  )}
                  {p.displayPriceAed != null && (
                    <p style={{ margin: 'var(--spacing-sm) 0 0', fontWeight: 700, color: 'var(--color-brand-bronze)' }}>
                      {isAr ? `${p.displayPriceAed} د.إ` : `AED ${p.displayPriceAed}`}
                    </p>
                  )}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
      <p style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
        <a href={`/${locale}/menu`} className="ms-btn ms-btn-secondary">{isAr ? 'القائمة كاملة' : 'View full menu'}</a>
      </p>
    </section>
  );
}

export function CateringCta({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  return (
    <section aria-labelledby="home-catering" style={{ margin: 'clamp(3rem, 7vw, 5rem) var(--spacing-lg) 0', borderRadius: 24, background: 'var(--color-bg-muted)', border: '1px solid var(--color-border)' }}>
      <div className="container mx-auto" style={{ padding: 'clamp(2rem, 5vw, 3rem)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-lg)' }}>
        <div style={{ maxWidth: 560 }}>
          <h2 id="home-catering" style={{ margin: 0, fontSize: 'clamp(1.35rem, 3vw, 1.85rem)', color: 'var(--color-brand-espresso)' }}>
            {isAr ? 'تخطط لمناسبة أو فعالية؟' : 'Planning an event or office order?'}
          </h2>
          <p style={{ margin: 'var(--spacing-sm) 0 0', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            {isAr ? 'أخبرنا بما تحتاجه وسيتواصل معك فريقنا.' : 'Tell us what you need and our team will get back to you.'}
          </p>
        </div>
        <a href={`/${locale}/contact`} className="ms-btn ms-btn-primary">{isAr ? 'اطلب خدمة التموين' : 'Enquire about catering'}</a>
      </div>
    </section>
  );
}

// Answers describe only what the site itself does. Arabic copy needs native-speaker review.
const FAQ = [
  {
    q: { en: 'How do I find my nearest branch?', ar: 'كيف أجد أقرب فرع إليّ؟' },
    a: { en: 'Open the branches page and share your location to see the closest branches, or browse the full list by emirate.', ar: 'افتح صفحة الفروع وشارك موقعك لعرض أقرب الفروع، أو تصفح القائمة الكاملة حسب الإمارة.' },
  },
  {
    q: { en: 'Are opening hours the same at every branch?', ar: 'هل ساعات العمل واحدة في كل الفروع؟' },
    a: { en: 'Not necessarily. Each branch page shows that branch’s own hours and whether it is open right now.', ar: 'ليس بالضرورة. تعرض صفحة كل فرع ساعات عمله وما إذا كان مفتوحاً الآن.' },
  },
  {
    q: { en: 'Can I check allergens before I visit?', ar: 'هل يمكنني معرفة مسببات الحساسية قبل الزيارة؟' },
    a: { en: 'The menu shows allergen and dietary labels where they are available. If you have a serious allergy, please also speak to the branch team.', ar: 'تعرض القائمة بيانات مسببات الحساسية والخيارات الغذائية متى توفرت. وإذا كانت لديك حساسية شديدة فيرجى إخبار فريق الفرع أيضاً.' },
  },
  {
    q: { en: 'Can I order online?', ar: 'هل يمكنني الطلب عبر الإنترنت؟' },
    a: { en: 'Online ordering is not available on this website at the moment. You can browse the menu here and order at any branch.', ar: 'الطلب عبر الإنترنت غير متاح على هذا الموقع حالياً. يمكنك تصفح القائمة هنا والطلب من أي فرع.' },
  },
  {
    q: { en: 'How do I enquire about catering or corporate orders?', ar: 'كيف أستفسر عن خدمات التموين أو طلبات الشركات؟' },
    a: { en: 'Send us a message through the contact page with your details and what you need, and our team will respond.', ar: 'أرسل لنا رسالة عبر صفحة التواصل مع بياناتك واحتياجك، وسيرد عليك فريقنا.' },
  },
] as const;

export function FaqSection({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  const l = isAr ? 'ar' : 'en';
  return (
    <section aria-labelledby="home-faq" className="container mx-auto" style={{ padding: 'clamp(3rem, 7vw, 5rem) var(--spacing-lg)', maxWidth: 820 }}>
      <h2 id="home-faq" style={H2}>{isAr ? 'أسئلة شائعة' : 'Frequently asked questions'}</h2>
      <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
        {FAQ.map((item) => (
          <details key={item.q.en} className="ms-surface" style={{ padding: 0 }}>
            <summary style={{ cursor: 'pointer', padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600, color: 'var(--color-brand-espresso)', minHeight: 44 }}>
              {item.q[l]}
            </summary>
            <p style={{ margin: 0, padding: '0 var(--spacing-lg) var(--spacing-md)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{item.a[l]}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
