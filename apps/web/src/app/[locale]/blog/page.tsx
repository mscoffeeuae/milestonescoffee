import type { Metadata } from 'next';
import Link from 'next/link';

interface BlogPageProps { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'ar' ? 'المدونة' : 'Blog',
    description: locale === 'ar' ? 'أخبار ومقالات ميلستونز كوفي' : 'News and stories from Milestones Coffee.',
  };
}

interface BlogPost { _id: string; title: string; slug: { current: string }; publishedAt: string; excerpt: string; "mainImage": string | null; }

async function getPosts(): Promise<BlogPost[]> {
  try {
    const query = encodeURIComponent('*[_type == "post"] | order(publishedAt desc) { _id, title, slug, publishedAt, "excerpt": coalesce(excerpt, pt::text(body)[0..160]), "mainImage": mainImage.asset->url }');
    const res = await fetch(`https://txh3gqgo.api.sanity.io/v2021-10-21/data/query/production?query=${query}`, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.result ?? [];
  } catch { return []; }
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-AE', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  const posts = await getPosts();
  return (
    <main style={{ minHeight: '70vh', padding: 'var(--spacing-2xl) var(--spacing-xl)', maxWidth: '1280px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>
        {isAr ? 'المدونة' : 'Blog'}
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2xl)', fontSize: '1.1rem' }}>
        {isAr ? 'أخبار وقصص من عالم ميلستونز' : 'News and stories from the world of Milestones'}
      </p>
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>✍️</p>
          <p style={{ fontSize: '1.1rem' }}>{isAr ? 'المقالات قادمة قريباً' : 'Articles coming soon'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-xl)' }}>
          {posts.map((post) => (
            <Link key={post._id} href={`/${locale}/blog/${post.slug.current}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <article style={{ background: 'var(--color-surface-raised)', borderRadius: '16px', overflow: 'hidden', height: '100%', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
                {post.mainImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.mainImage} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} loading="lazy" />
                )}
                <div style={{ padding: 'var(--spacing-lg)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(post.publishedAt, locale)}</p>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-brand-espresso)', lineHeight: 1.4 }}>{post.title}</h2>
                  {post.excerpt && <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{post.excerpt}</p>}
                  <p style={{ marginTop: 'auto', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-brand-gold)' }}>{isAr ? 'اقرأ المزيد ←' : 'Read more →'}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
