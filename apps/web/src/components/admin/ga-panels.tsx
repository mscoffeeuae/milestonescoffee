import type { GaReport } from '@/lib/admin/ga4';
import type { T } from '@/lib/admin/i18n';
import { BarList, Card, Stat } from './ui';
import { LineChart } from './line-chart';

const fmtN = (n: number) => n.toLocaleString('en');

export function GaOverview({ r, t, days }: { r: GaReport; t: T; days: number }) {
  const total = r.devices.reduce((s, d) => s + (d.metrics[0] ?? 0), 0) || 1;
  const pct = (name: string) => Math.round(((r.devices.find((d) => d.dims[0] === name)?.metrics[0] ?? 0) / total) * 100);
  return (
    <div className="space-y-[var(--spacing-lg)]">
      <div className="grid grid-cols-2 gap-[var(--spacing-md)] lg:grid-cols-4">
        <Stat label={`${t('pageViews')} (${days}d)`} value={fmtN(r.views)} />
        <Stat label={`${t('users')} (${days}d)`} value={fmtN(r.users)} />
        <Stat label="Mobile" value={`${pct('mobile')}%`} />
        <Stat label="Desktop" value={`${pct('desktop')}%`} />
      </div>
      <Card title={t('trend')}>
        {r.daily.length > 1 ? <LineChart points={r.daily} label={t('trend')} /> : <p className="text-sm text-[var(--color-text-muted)]">{t('noData')}</p>}
      </Card>
      <Card title={t('topBranchPages')}>
        <BarList rows={r.topBranchPages.map((p) => ({ label: p.dims[0] ?? '', value: p.metrics[0] ?? 0 }))} t={t} labelKey="page" />
      </Card>
    </div>
  );
}

export function GaTables({ r, t }: { r: GaReport; t: T }) {
  const rows = (list: GaReport['topPages']) => list.map((p) => ({ label: p.dims[0] ?? '', value: p.metrics[0] ?? 0 }));
  return (
    <div className="grid gap-[var(--spacing-lg)] lg:grid-cols-2">
      <Card title={t('topPages')}><BarList rows={rows(r.topPages)} t={t} labelKey="page" /></Card>
      <Card title={t('sources')}><BarList rows={rows(r.sources)} t={t} labelKey="source" /></Card>
      <Card title={t('countries')}><BarList rows={rows(r.countries)} t={t} labelKey="country" /></Card>
    </div>
  );
}
