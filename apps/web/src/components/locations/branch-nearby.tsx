import Link from 'next/link';
import { formatKm } from '@/lib/geo';

export interface NearbyBranch {
  slug: string;
  name: string;
  area: string;
  km: number;
}

export function BranchNearby({ isAr, locale, items }: { isAr: boolean; locale: string; items: NearbyBranch[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="nearby-h">
      <h2 id="nearby-h" className="mb-4 text-xl font-bold text-[var(--color-brand-espresso,#3B1F0E)]">
        {isAr ? 'فروع أخرى قريبة' : 'Other branches nearby'}
      </h2>
      <ul role="list" className="grid gap-3 sm:grid-cols-3">
        {items.map((b) => (
          <li key={b.slug}>
            <Link
              href={`/${locale}/locations/${b.slug}`}
              className="block h-full rounded-2xl bg-white p-4 no-underline shadow-sm ring-1 ring-black/5 transition hover:ring-[var(--color-brand-gold,#C9A87C)]"
            >
              <span className="block font-semibold text-[var(--color-brand-espresso,#3B1F0E)]">{b.name}</span>
              <span className="mt-1 block text-xs text-black/50">{b.area}</span>
              <span className="mt-2 block text-sm tabular-nums text-[var(--color-brand-bronze,#A0784A)]">
                {formatKm(b.km, isAr)} {isAr ? 'من هذا الفرع' : 'from here'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
