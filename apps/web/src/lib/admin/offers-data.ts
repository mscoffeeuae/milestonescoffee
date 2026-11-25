import { readClient } from './sanity-client';

/**
 * Offers for the admin list. The date window is the existing `validFrom` / `validUntil`
 * pair on the Sanity `offer` type (the same fields the homepage query filters on).
 */

export type OfferStatus = 'active' | 'upcoming' | 'expired' | 'inactive';

export interface AdminOffer {
  _id: string;
  titleEn: string;
  titleAr: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  status: OfferStatus;
}

export function offerStatus(
  o: { validFrom: string | null; validUntil: string | null; isActive: boolean | null },
  now = new Date(),
): OfferStatus {
  if (!o.isActive) return 'inactive';
  const t = now.getTime();
  if (o.validFrom && new Date(o.validFrom).getTime() > t) return 'upcoming';
  if (o.validUntil && new Date(o.validUntil).getTime() <= t) return 'expired';
  return 'active';
}

export async function listOffers(): Promise<AdminOffer[]> {
  const c = readClient();
  if (!c) return [];
  try {
    const rows = await c.fetch<{ _id: string; titleEn: string; titleAr: string | null; validFrom: string | null; validUntil: string | null; isActive: boolean | null }[]>(
      `*[_type == "offer"] | order(validFrom desc){_id, titleEn, titleAr, validFrom, validUntil, isActive}`,
    );
    return rows.map((r) => ({ ...r, isActive: Boolean(r.isActive), status: offerStatus(r) }));
  } catch (err) {
    console.error('[admin/offers] list failed', err instanceof Error ? err.message : err);
    return [];
  }
}
