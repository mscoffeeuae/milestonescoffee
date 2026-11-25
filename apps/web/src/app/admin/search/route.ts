import { isAdmin } from '@/lib/admin/guard';
import { getSnapshot } from '@/lib/admin/data';
import { makeT, type AdminKey } from '@/lib/admin/i18n';
import { readClient } from '@/lib/admin/sanity-client';

export const dynamic = 'force-dynamic';

export interface SearchEntry {
  type: 'menu' | 'branch' | 'offer' | 'page';
  en: string;
  ar: string;
  sub?: string;
  href: string;
}

const PAGES: [string, AdminKey][] = [
  ['/admin', 'dashboard'], ['/admin/menu', 'menu'], ['/admin/menu/new', 'addItem'],
  ['/admin/menu/import', 'importMenu'], ['/admin/branches', 'branches'], ['/admin/offers', 'offers'],
  ['/admin/activity', 'activity'], ['/admin/analytics', 'analytics'], ['/admin/settings', 'settings'],
];

/** GET -> every searchable admin entry. The browser filters it, so typing needs no round trips. */
export async function GET(): Promise<Response> {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });
  const en = makeT('en');
  const ar = makeT('ar');
  const entries: SearchEntry[] = PAGES.map(([href, key]) => ({ type: 'page', en: en(key), ar: ar(key), href }));

  const c = readClient();
  if (c) {
    try {
      const r = await c.fetch<{
        products: { _id: string; nameEn: string; nameAr: string | null; cat: string | null }[];
        offers: { _id: string; titleEn: string; titleAr: string | null }[];
      }>(`{
        "products": *[_type == "menuProduct"] | order(nameEn asc)[0...1000]{_id, nameEn, nameAr, "cat": category->nameEn},
        "offers": *[_type == "offer"] | order(validFrom desc)[0...200]{_id, titleEn, titleAr}
      }`);
      for (const p of r.products) {
        entries.push({ type: 'menu', en: p.nameEn, ar: p.nameAr || p.nameEn, ...(p.cat ? { sub: p.cat } : {}), href: `/admin/menu/${encodeURIComponent(p._id)}` });
      }
      for (const o of r.offers) entries.push({ type: 'offer', en: o.titleEn, ar: o.titleAr || o.titleEn, href: '/admin/offers' });
    } catch (err) {
      console.error('[admin/search] index failed', err instanceof Error ? err.message : err);
    }
  }
  const snap = await getSnapshot();
  for (const b of snap.branches) {
    entries.push({ type: 'branch', en: b.nameEn, ar: b.nameAr || b.nameEn, href: `/admin/branches?q=${encodeURIComponent(b.nameEn)}` });
  }

  return new Response(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
