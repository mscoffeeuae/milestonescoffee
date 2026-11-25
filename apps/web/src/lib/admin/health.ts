import { getSnapshot, studioEditUrl, type AdminBranch, type AdminSnapshot } from './data';
import { readClient } from './sanity-client';

/** Content-health counts and the first few offending items, for the dashboard alerts. */

export interface HealthItem { id: string; name: string; sub?: string }
export interface HealthGroup { key: 'noArabic' | 'hiddenItems' | 'branchNoHours' | 'branchNoPhotos' | 'unoptimised'; count: number; items: HealthItem[] }

const SAMPLE = 5;

export async function getHealth(existing?: AdminSnapshot): Promise<{ groups: HealthGroup[]; branches: AdminBranch[] }> {
  const c = readClient();
  const snap = existing ?? (await getSnapshot());

  let menu = { noArabic: { count: 0, items: [] as HealthItem[] }, hidden: { count: 0, items: [] as HealthItem[] }, unopt: { count: 0, items: [] as HealthItem[] } };
  if (c) {
    try {
      const f = (cond: string) => `{"count": count(*[_type == "menuProduct" && ${cond}]), "items": *[_type == "menuProduct" && ${cond}] | order(nameEn asc)[0...${SAMPLE}]{"id": _id, "name": nameEn}}`;
      menu = await c.fetch(
        `{"noArabic": ${f('!defined(nameAr) || nameAr == ""')},
          "hidden": ${f('isActive != true')},
          "unopt": ${f('defined(productImage.asset) && !defined(imageMeta.fullBytes)')}}`,
      );
    } catch (err) {
      console.error('[admin/health] menu query failed', err instanceof Error ? err.message : err);
    }
  }
  const noHours = snap.branches.filter((b) => b.missing.includes('hours'));
  const noPhotos = snap.branches.filter((b) => b.missing.includes('photos'));
  const bItems = (l: AdminBranch[]): HealthItem[] => l.slice(0, SAMPLE).map((b) => ({ id: b.id, name: b.nameEn }));

  return {
    branches: snap.branches,
    groups: [
      { key: 'noArabic', count: menu.noArabic.count, items: menu.noArabic.items },
      { key: 'hiddenItems', count: menu.hidden.count, items: menu.hidden.items },
      { key: 'unoptimised', count: menu.unopt.count, items: menu.unopt.items },
      { key: 'branchNoHours', count: noHours.length, items: bItems(noHours) },
      { key: 'branchNoPhotos', count: noPhotos.length, items: bItems(noPhotos) },
    ],
  };
}

export { studioEditUrl };
