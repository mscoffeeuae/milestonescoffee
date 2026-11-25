import Link from 'next/link';
import { studioEditUrl, type AdminBranch } from '@/lib/admin/data';
import type { HealthGroup } from '@/lib/admin/health';
import type { T } from '@/lib/admin/i18n';
import { Card } from './ui';

const VIEW_ALL: Record<HealthGroup['key'], string> = {
  noArabic: '/admin/menu?issue=noar',
  hiddenItems: '/admin/menu?issue=hidden',
  unoptimised: '/admin/menu?issue=unoptimised',
  branchNoHours: '/admin/branches?missing=hours',
  branchNoPhotos: '/admin/branches?missing=photos',
};

/** Where to fix one flagged item. */
function itemLink(key: HealthGroup['key'], id: string, branches: AdminBranch[]): { href: string; external: boolean } {
  if (key === 'noArabic' || key === 'hiddenItems' || key === 'unoptimised') return { href: `/admin/menu/${encodeURIComponent(id)}`, external: false };
  const b = branches.find((x) => x.id === id);
  if (key === 'branchNoPhotos' && b && !b.isFallback) return { href: `/admin/branches/${encodeURIComponent(id)}/gallery`, external: false };
  return { href: b ? studioEditUrl(b) : '/admin/branches', external: Boolean(b) };
}

/** "Content to fix": one card per issue type with its count and the first few offenders. */
export function HealthAlerts({ groups, branches, t }: { groups: HealthGroup[]; branches: AdminBranch[]; t: T }) {
  const total = groups.reduce((n, g) => n + g.count, 0);
  return (
    <section aria-labelledby="health-alerts" className="space-y-[var(--spacing-md)]">
      <h2 id="health-alerts" className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
        {t('healthAlerts')}
        <span className="ms-2 text-sm font-normal text-[var(--color-text-muted)]">({total})</span>
      </h2>
      {total === 0 && <p role="status" className="text-sm text-[var(--color-success)]">{t('healthOk')}</p>}
      <div className="grid gap-[var(--spacing-md)] sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <Card key={g.key}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold">{t(g.key)}</h3>
              <span
                className="rounded-[var(--radius-full)] px-2.5 py-0.5 text-sm font-semibold tabular-nums"
                style={{ color: g.count ? 'var(--color-warning)' : 'var(--color-success)', border: `1px solid ${g.count ? 'var(--color-warning)' : 'var(--color-success)'}` }}
              >
                {g.count}
              </span>
            </div>
            {g.count > 0 && (
              <>
                <ul className="mt-3 space-y-1 text-sm">
                  {g.items.map((i) => {
                    const l = itemLink(g.key, i.id, branches);
                    return (
                      <li key={i.id} className="truncate">
                        {l.external ? (
                          <a href={l.href} target="_blank" rel="noreferrer" className="text-[var(--color-interactive-hover)] hover:underline">{i.name}</a>
                        ) : (
                          <Link href={l.href} className="text-[var(--color-interactive-hover)] hover:underline">{i.name}</Link>
                        )}
                      </li>
                    );
                  })}
                  {g.count > g.items.length && <li className="text-xs text-[var(--color-text-muted)]">+{g.count - g.items.length} {t('andMore')}</li>}
                </ul>
                <Link href={VIEW_ALL[g.key]} className="mt-3 inline-block text-sm font-medium text-[var(--color-interactive-hover)] hover:underline">
                  {t('viewAll')} →
                </Link>
              </>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
