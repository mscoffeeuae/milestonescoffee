import type { Metadata } from 'next';
import Link from 'next/link';

interface PostPageProps { params: Promise<{ locale: string; slug: string }>; }

interface Post { _id: string; title: string; publishedAt: string; body: Array<{ _type: string; style?: string; children?: Array<{ text: string }> }>; "mainImage": string | null; "authorName": string | null; }

async function getPost(slug: string): Promise<Post | null> {
  try {
    const query = encodeURIComponent(`*[_type == "post" && slug.current == "${slug}"][0] { _id, title, publishedAt, body, "mainImage": mainImage.asset->url, "authorName": author->name }`);
    const res = await fetch(`https://txh3gqgo.api.sanity.io/v2021-10-21/data/query/production?query=${query}`, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result ?? null;
  } catch { return null; }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return { title: post?.title ?? 'Blog Post' };
}

function renderBody(body: Post['body']) {
  if (!body?.length) return null;
  return body.map((block, i) => {
    if (block._type !== 'block') return null;
    const text = block.children?.map(c => c.text).join('') ?? '';
    const style = block.style ?? 'normal';
    if (style === 'h1') return <h1 key={i} style={{ fontSize: '1.8rem', fontWeight: 800, margin: '1.5rem 0 0.75rem', color: 'var(--color-brand-espresso)' }}>{text}</h1>;
    if (style === 'h2') return <h2 key={i} style={{ fontSize: '1.4rem', fontWeight: 700, margin: '1.5rem 0 0.5rem', color: 'var(--color-brand-espresso)' }}>{text}</h2>;
    if (style === 'h3') return <h3 key={i} style={{ fontSize: '1.1rem', fontWeight: 700, margin: '1rem 0 0.5rem', color: 'var(--color-brand-espresso)' }}>{text}</h3>;
    return <p key={i} style={{ marginBottom: '1rem', lineHeight: 1.8 }}>{text}</p>;
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { locale, slug } = await params;
  const isAr = locale === 'ar';
  const post = await getPost(slug);
  if (!post) {
    return (
      <main style={{ minHeight: '70vh', padding: 'var(--spacing-2xl) var(--spacing-xl)', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: '3rem' }}>📄</p>
        <h1 style={{ color: 'var(--color-brand-espresso)' }}>{isAr ? 'المقال غير موجود' : 'Post not found'}</h1>
        <Link href={`/${locale}/blog`} style={{ color: 'var(--color-brand-gold)' }}>{isAr ? '← العودة للمدونة' : '← Back to Blog'}</Link>
      </main>
    );
  }
  return (
    <main style={{ minHeight: '70vh', padding: 'var(--spacing-2xl) var(--spacing-xl)', maxWidth: '800px', margin: '0 auto' }}>
      <Link href={`/${locale}/blog`} style={{ color: 'var(--color-brand-gold)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
        {isAr ? '← العودة للمدونة' : '← Back to Blog'}
      </Link>
      {post.mainImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.mainImage} alt={post.title} style={{ width: '100%', borderRadius: '16px', margin: 'var(--spacing-xl) 0', maxHeight: '400px', objectFit: 'cover' }} />
      )}
      <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)', lineHeight: 1.3 }}>{post.title}</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 'var(--spacing-2xl)' }}>
        {new Date(post.publishedAt).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE', { year: 'numeric', month: 'long', day: 'numeric' })}
        {post.authorName && ` · ${post.authorName}`}
      </p>
      <div style={{ lineHeight: 1.8, color: 'var(--color-text-body)', fontSize: '1.05rem' }}>
        {renderBody(post.body)}
      </div>
    </main>
  );
}
