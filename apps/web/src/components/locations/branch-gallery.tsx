export interface GalleryImage {
  asset: { url: string } | null;
}

interface BranchGalleryProps {
  isAr: boolean;
  name: string;
  images: GalleryImage[];
}

/** Photo grid from CMS images; a neutral placeholder when the branch has none. */
export function BranchGallery({ isAr, name, images }: BranchGalleryProps) {
  const urls = images.flatMap((i) => (i.asset?.url ? [i.asset.url] : []));

  if (urls.length === 0) {
    return (
      <div
        role="img"
        aria-label={isAr ? `صور ${name} قريباً` : `Photos of ${name} coming soon`}
        className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand-espresso,#3B1F0E)]/5 text-[var(--color-brand-espresso,#3B1F0E)]/60 ring-1 ring-black/5 md:h-72"
      >
        <svg aria-hidden width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
          <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
        </svg>
        <span className="text-sm">{isAr ? 'الصور قريباً' : 'Photos coming soon'}</span>
      </div>
    );
  }

  return (
    <ul role="list" className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {urls.map((url, i) => (
        <li key={url} className={i === 0 ? 'col-span-2 md:col-span-3' : ''}>
          {/* Sanity CDN host is not in next/image remotePatterns; plain lazy img keeps the diff small. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${url}?w=1200&auto=format`}
            alt={`${name} ${i + 1}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`w-full rounded-2xl object-cover ring-1 ring-black/5 ${i === 0 ? 'h-56 md:h-80' : 'h-32 md:h-44'}`}
          />
        </li>
      ))}
    </ul>
  );
}
