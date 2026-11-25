import sharp from 'sharp';

/**
 * Server-side image optimisation for every admin upload (menu form, menu ZIP import,
 * re-optimise, branch gallery). Server-only: imports sharp.
 *
 * Pipeline: validate by file contents -> auto-rotate from EXIF -> drop metadata ->
 * fit inside 1600px (never upscale) -> WebP q82 full + 600px WebP q80 thumbnail
 * (+ AVIF only when it is smaller than the WebP).
 */

export const MAX_INPUT_BYTES = 5 * 1024 * 1024;
export const FULL_MAX_PX = 1600;
export const THUMB_MAX_PX = 600;
export const FULL_QUALITY = 82;
export const THUMB_QUALITY = 80;
const MAX_INPUT_PIXELS = 100_000_000; // decompression-bomb guard (a 6000x4000 photo is 24 MP)

export type ImageKind = 'jpeg' | 'png' | 'webp' | 'heic';

export type ImageErrorCode = 'type' | 'size' | 'decode';
export class ImageError extends Error {
  readonly code: ImageErrorCode;
  constructor(code: ImageErrorCode, message: string) {
    super(message);
    this.name = 'ImageError';
    this.code = code;
  }
}

const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1']);

/** Detects the real format from the leading bytes, ignoring file name and declared type. */
export function sniffImage(b: Uint8Array): ImageKind | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'webp';
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8]!, b[9]!, b[10]!, b[11]!);
    if (HEIC_BRANDS.has(brand)) return 'heic';
  }
  return null;
}

const MIME: Record<ImageKind, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic' };
const EXT: Record<ImageKind, string> = { jpeg: 'jpg', png: 'png', webp: 'webp', heic: 'heic' };

export interface OptimisedImage {
  full: Buffer;
  fullType: string;
  fullExt: string;
  thumb: Buffer;
  avif: Buffer | null;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
  originalBytes: number;
  fullBytes: number;
  thumbBytes: number;
  avifBytes: number | null;
  /** True when the original was already smaller than the WebP and needed no change. */
  keptOriginal: boolean;
  originalKind: ImageKind;
  originalWidth: number;
  originalHeight: number;
}

/** Throws ImageError('type'|'size'|'decode'). `maxBytes` defaults to the 5 MB upload limit. */
export async function optimiseImage(input: Buffer, maxBytes: number = MAX_INPUT_BYTES): Promise<OptimisedImage> {
  if (input.length > maxBytes) throw new ImageError('size', 'Image is larger than the size limit.');
  const kind = sniffImage(input);
  if (!kind) throw new ImageError('type', 'File is not a JPEG, PNG, WebP or HEIC image.');

  try {
    const open = () => sharp(input, { failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS });
    const meta = await open().metadata();
    if (!meta.width || !meta.height) throw new Error('no dimensions');
    // EXIF orientation 5-8 means width/height are swapped once rotated.
    const swapped = (meta.orientation ?? 1) >= 5;
    const originalWidth = swapped ? meta.height : meta.width;
    const originalHeight = swapped ? meta.width : meta.height;

    // .rotate() with no argument applies EXIF orientation; output carries no metadata by default.
    const fit = (px: number) => ({ width: px, height: px, fit: 'inside' as const, withoutEnlargement: true });
    const webp = await open().rotate().resize(fit(FULL_MAX_PX)).webp({ quality: FULL_QUALITY }).toBuffer({ resolveWithObject: true });
    const thumb = await open().rotate().resize(fit(THUMB_MAX_PX)).webp({ quality: THUMB_QUALITY }).toBuffer({ resolveWithObject: true });
    const avifBuf = await open().rotate().resize(fit(FULL_MAX_PX)).avif({ quality: 50, effort: 4 }).toBuffer();

    const avif = avifBuf.length < webp.data.length ? avifBuf : null;

    const carriesMetadata = Boolean(meta.exif || meta.xmp || meta.iptc || meta.tifftagPhotoshop);
    const untouched =
      kind !== 'heic' &&
      !carriesMetadata &&
      (meta.orientation ?? 1) === 1 &&
      Math.max(originalWidth, originalHeight) <= FULL_MAX_PX &&
      !meta.pages; // multi-frame files are flattened by the re-encode
    const keptOriginal = untouched && input.length < webp.data.length;

    return {
      full: keptOriginal ? input : webp.data,
      fullType: keptOriginal ? MIME[kind] : 'image/webp',
      fullExt: keptOriginal ? EXT[kind] : 'webp',
      thumb: thumb.data,
      avif,
      width: keptOriginal ? originalWidth : webp.info.width,
      height: keptOriginal ? originalHeight : webp.info.height,
      thumbWidth: thumb.info.width,
      thumbHeight: thumb.info.height,
      originalBytes: input.length,
      fullBytes: keptOriginal ? input.length : webp.data.length,
      thumbBytes: thumb.data.length,
      avifBytes: avif ? avif.length : null,
      keptOriginal,
      originalKind: kind,
      originalWidth,
      originalHeight,
    };
  } catch (err) {
    if (err instanceof ImageError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (kind === 'heic') {
      throw new ImageError('decode', 'This HEIC file could not be decoded on the server. Export it as JPEG and try again.');
    }
    throw new ImageError('decode', `Image could not be read (${msg.slice(0, 120)}).`);
  }
}

/** "photo.JPG" -> "photo" (safe for use as a Sanity asset filename). */
export function baseName(filename: string): string {
  const leaf = filename.split(/[\\/]/).pop() ?? 'image';
  const stem = leaf.replace(/\.[^.]+$/, '');
  return stem.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'image';
}

/** Cheap pre-check (type by contents, size, decodable header) without running the full pipeline. */
export async function validateImage(input: Buffer, maxBytes: number = MAX_INPUT_BYTES): Promise<ImageKind> {
  if (input.length > maxBytes) throw new ImageError('size', 'Image is larger than the size limit.');
  const kind = sniffImage(input);
  if (!kind) throw new ImageError('type', 'File is not a JPEG, PNG, WebP or HEIC image.');
  try {
    const m = await sharp(input, { failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS }).metadata();
    if (!m.width || !m.height) throw new Error('no dimensions');
  } catch {
    throw new ImageError(
      'decode',
      kind === 'heic'
        ? 'This HEIC file could not be decoded on the server. Export it as JPEG and try again.'
        : 'Image could not be read; the file looks corrupt.',
    );
  }
  return kind;
}
