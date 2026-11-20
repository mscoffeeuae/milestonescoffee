import type { Metadata } from 'next';
import { client } from '@milestones/cms';
import { groq } from 'next-sanity';

interface GalleryPageProps { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'ar' ? 'معرض الصور' : 'Gallery',
    description: locale === 'ar' ? 'استمتع بتجربة ميلستونز كوفي من خلال معرض صورنا' : 'Experience Milestones Coffee through our photo gallery.',
  };
}

const GALLERY_QUERY = groq`*[_type == "galleryImage"] | order(_createdAt desc) { _id, title, "url": image.asset->url, "alt": coalesce(image.alt, title, "Milestones Coffee") }`;
interface GalleryImage { _id: string; title: string; url: string; alt: string; }

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  let images: GalleryImage[] = [];
  try { images = await client.fetch(GALLERY_QUERY); } catch { /* CMS unavailable */ }
  return (
    <main style={{ minHeight: '70vh', padding: 'var(--spacing-2xl) var(--spacing-xl)', maxWidth: '1280px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, marginBottom: 'var(--spacing-sm)', color: 'var(--color-brand-espresso)' }}>
        {isAr ? 'معرض الصور' : 'Gallery'}
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2xl)', fontSize: '1.1rem' }}>
        {isAr ? 'لحظات من تجربتنا' : 'Moments from our experience'}
      </p>
      {images.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📸</p>
          <p style={{ fontSize: '1.1rem' }}>{isAr ? 'الصور قادمة قريباً' : 'Photos coming soon'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
          {images.map((img) => (
            <div key={img._id} style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3', background: 'var(--color-surface-raised)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
