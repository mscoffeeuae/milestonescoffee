import { ImageResponse } from 'next/og';
import { sanityFetch } from '@/lib/sanity/client';
import { BRANCH_BY_SLUG_QUERY } from '@/lib/sanity/queries';
import { BRANCHES_FALLBACK } from '@/lib/branches-fallback';

export const alt = 'Milestones Coffee branch';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

const EMIRATES: Record<string, string> = {
  'abu-dhabi': 'Abu Dhabi',
  dubai: 'Dubai',
  sharjah: 'Sharjah',
  ajman: 'Ajman',
  'umm-al-quwain': 'Umm Al Quwain',
  'ras-al-khaimah': 'Ras Al Khaimah',
  fujairah: 'Fujairah',
};

interface Row {
  nameEn: string;
  emirate: string;
}

// The default OG font has no Arabic glyphs, so the card uses the English name for both locales.
export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const cms = await sanityFetch<Row>(BRANCH_BY_SLUG_QUERY, { slug });
  const b = cms ?? (BRANCHES_FALLBACK as unknown as Row[] & { slug: string }[]).find((x) => (x as unknown as { slug: string }).slug === slug);
  const name = b?.nameEn ?? 'Milestones Coffee';
  const area = b ? (EMIRATES[b.emirate] ?? '') : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#3B1F0E',
          color: '#F5F0E8',
        }}
      >
        <div style={{ fontSize: 32, color: '#C9A87C', letterSpacing: 4 }}>MILESTONES COFFEE</div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>{name}</div>
        {area && <div style={{ fontSize: 36, marginTop: 24, color: '#C9A87C' }}>{`${area}, UAE`}</div>}
      </div>
    ),
    size,
  );
}
