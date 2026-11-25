import Image from 'next/image';

/** Shape returned by GROQ `field { asset->{ url, metadata { lqip, dimensions } } }`. */
export interface CmsImageSource {
  asset: {
    url: string;
    metadata?: { lqip?: string | null; dimensions?: { width: number; height: number } | null } | null;
  } | null;
}

interface CmsImageProps {
  image: CmsImageSource | null | undefined;
  alt: string;
  /** Responsive `sizes` hint; defaults to full width. */
  sizes?: string;
  className?: string;
  priority?: boolean;
}

/**
 * next/image for Sanity assets. Intrinsic width/height come from the asset metadata (so the
 * browser reserves space before load) and the Sanity LQIP is the blur placeholder.
 * Returns null when there is no image so callers keep their own fallback.
 */
export function CmsImage({ image, alt, sizes = '100vw', className, priority }: CmsImageProps) {
  const url = image?.asset?.url;
  if (!url) return null;
  const dims = image.asset?.metadata?.dimensions;
  const lqip = image.asset?.metadata?.lqip;
  return (
    <Image
      src={url}
      alt={alt}
      width={dims?.width ?? 1200}
      height={dims?.height ?? 900}
      sizes={sizes}
      {...(className ? { className } : {})}
      {...(priority ? { priority: true } : { loading: 'lazy' as const })}
      {...(lqip ? { placeholder: 'blur' as const, blurDataURL: lqip } : {})}
    />
  );
}
