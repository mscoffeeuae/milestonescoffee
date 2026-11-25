import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';
import { getT } from '@/lib/admin/lang';
import { getGaReport } from '@/lib/admin/ga4';
import { ConnectGa } from '@/components/admin/ui';
import { GaOverview, GaTables } from '@/components/admin/ga-panels';

const RANGES = [7, 30, 90] as const;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin();
  const { days: raw } = await searchParams;
  const days = RANGES.find((d) => String(d) === raw) ?? 30;
  const { t } = await getT();
  const ga = await getGaReport(days, true);

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('analytics')}</h1>
        <nav aria-label="Date range" className="flex gap-1">
          {RANGES.map((d) => (
            <Link
              key={d}
              href={`/admin/analytics?days=${d}`}
              aria-current={d === days ? 'true' : undefined}
              className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-sm ${
                d === days
                  ? 'border-[var(--color-interactive)] bg-[var(--color-interactive)] text-white'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]'
              }`}
            >
              {d} {t('days')}
            </Link>
          ))}
        </nav>
      </div>
      {ga.status === 'ok' ? (
        <>
          <GaOverview r={ga.data} t={t} days={days} />
          <GaTables r={ga.data} t={t} />
        </>
      ) : (
        <ConnectGa t={t} error={ga.status === 'error'} />
      )}
    </div>
  );
}
