import { createClient } from '@sanity/client';
import { BRANCHES_FALLBACK } from '@/lib/branches-fallback';

export type MissingField = 'hours' | 'phone' | 'photos' | 'services';
export type OpenState = 'open' | 'closed' | 'unknown';

export interface AdminBranch {
  id: string;
  nameEn: string;
  nameAr: string | null;
  slug: string;
  emirate: string;
  isFallback: boolean;
  state: OpenState;
  missing: MissingField[];
  updatedAt: string | null;
}

export interface AdminSnapshot {
  branches: AdminBranch[];
  menuItems: number | null;
  lastEdit: string | null;
  usingFallback: boolean;
  cmsAvailable: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type Hours = Record<string, unknown>;

interface RawBranch {
  _id: string;
  _updatedAt?: string;
  nameEn?: string;
  nameAr?: string | null;
  slug?: string;
  emirate?: string;
  phone?: string | null;
  services?: unknown[] | null;
  openingHours?: Hours | null;
  hasHero?: boolean;
  galleryCount?: number;
  heroImage?: unknown;
}

const QUERY = `{
  "branches": *[_type == "branch" && isActive == true] | order(emirate asc, nameEn asc) {
    _id, _updatedAt, nameEn, nameAr, "slug": slug.current, emirate, phone, services, openingHours,
    "hasHero": defined(heroImage.asset), "galleryCount": count(galleryImages)
  },
  "menuItems": count(*[_type == "menuProduct"]),
  "lastEdit": *[_type in ["branch","menuProduct","menuCategory","offer","corporatePage"]] | order(_updatedAt desc)[0]._updatedAt
}`;

const toMin = (t: unknown) => {
  if (typeof t !== 'string' || !/^\d{2}:\d{2}$/.test(t)) return null;
  const [h = 0, m = 0] = t.split(':').map(Number);
  return h * 60 + m;
};

function slot(h: Hours, day: string): { o: number; c: number } | null | undefined {
  if (h[`${day}Closed`]) return null;
  const o = toMin(h[`${day}Open`]);
  const c = toMin(h[`${day}Close`]);
  return o == null || c == null ? undefined : { o, c };
}

function hasAnyHours(h: Hours | null | undefined): boolean {
  if (!h) return false;
  return DAYS.some((d) => slot(h, d) !== undefined);
}

/** Open/closed right now, using Asia/Dubai wall-clock time regardless of server TZ. */
export function openState(h: Hours | null | undefined, now = new Date()): OpenState {
  if (!h || !hasAnyHours(h)) return 'unknown';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai', weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = get('weekday').toLowerCase();
  const min = (Number(get('hour')) % 24) * 60 + Number(get('minute'));
  const i = DAYS.indexOf(day as (typeof DAYS)[number]);
  const prev = slot(h, DAYS[(i + 6) % 7] ?? '');
  if (prev && prev.c < prev.o && min < prev.c) return 'open'; // overnight spill-over
  const today = slot(h, day);
  if (today === undefined) return 'unknown';
  if (today) {
    const close = today.c <= today.o ? today.c + 1440 : today.c;
    if (min >= today.o && min < close) return 'open';
  }
  return 'closed';
}

function normalise(b: RawBranch, isFallback: boolean): AdminBranch {
  const missing: MissingField[] = [];
  if (!hasAnyHours(b.openingHours)) missing.push('hours');
  if (!b.phone?.trim()) missing.push('phone');
  const hasPhotos = isFallback ? Boolean(b.heroImage) : Boolean(b.hasHero) || (b.galleryCount ?? 0) > 0;
  if (!hasPhotos) missing.push('photos');
  if (!b.services || b.services.length === 0) missing.push('services');
  return {
    id: b._id,
    nameEn: b.nameEn ?? b.slug ?? b._id,
    nameAr: b.nameAr ?? null,
    slug: b.slug ?? '',
    emirate: b.emirate ?? '',
    isFallback,
    state: openState(b.openingHours),
    missing,
    updatedAt: b._updatedAt ?? null,
  };
}

/** Fresh (non-CDN) read so edits show up immediately in the admin. */
export async function getSnapshot(): Promise<AdminSnapshot> {
  const projectId = process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
  let raw: { branches: RawBranch[]; menuItems: number; lastEdit: string | null } | null = null;
  if (projectId) {
    try {
      const client = createClient({
        projectId,
        dataset: process.env['NEXT_PUBLIC_SANITY_DATASET'] ?? 'production',
        apiVersion: '2024-01-01',
        useCdn: false,
        perspective: 'published',
      });
      raw = await client.fetch(QUERY);
    } catch (err) {
      console.error('[admin] sanity fetch failed', err);
    }
  }

  const cmsBranches = raw?.branches ?? [];
  const usingFallback = cmsBranches.length === 0;
  const branches = usingFallback
    ? (BRANCHES_FALLBACK as unknown as RawBranch[]).map((b) => normalise(b, true))
    : cmsBranches.map((b) => normalise(b, false));

  return {
    branches,
    menuItems: raw ? raw.menuItems : null,
    lastEdit: raw?.lastEdit ?? null,
    usingFallback,
    cmsAvailable: raw !== null,
  };
}

/** Worst first: most missing fields, then name. */
export function sortWorstFirst(list: AdminBranch[]): AdminBranch[] {
  return [...list].sort((a, b) => b.missing.length - a.missing.length || a.nameEn.localeCompare(b.nameEn));
}

export function studioEditUrl(b: AdminBranch): string {
  const base = (process.env['SANITY_STUDIO_URL'] ?? '').replace(/\/$/, '');
  const projectId = process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] ?? '';
  if (!base) return `https://www.sanity.io/manage/project/${projectId}`;
  return b.isFallback ? `${base}/structure/branch` : `${base}/structure/branch;${b.id}`;
}

export const EMIRATE_LABELS: Record<string, { en: string; ar: string }> = {
  'abu-dhabi': { en: 'Abu Dhabi', ar: 'أبوظبي' },
  dubai: { en: 'Dubai', ar: 'دبي' },
  sharjah: { en: 'Sharjah', ar: 'الشارقة' },
  ajman: { en: 'Ajman', ar: 'عجمان' },
  'umm-al-quwain': { en: 'Umm Al Quwain', ar: 'أم القيوين' },
  'ras-al-khaimah': { en: 'Ras Al Khaimah', ar: 'رأس الخيمة' },
  fujairah: { en: 'Fujairah', ar: 'الفجيرة' },
};
