import { requireAdmin } from '@/lib/admin/guard';
import { formatDubai, getT } from '@/lib/admin/lang';
import { getSnapshot, sortWorstFirst, studioEditUrl, type MissingField } from '@/lib/admin/data';
import { getGaReport } from '@/lib/admin/ga4';
import { Card, ConnectGa, Stat, StatusBadge, Table, td, th } from '@/components/admin/ui';
import { GaOverview } from '@/components/admin/ga-panels';

export default async function DashboardPage() {
  await requireAdmin();
  const { lang, t } = await getT();
  const [snap, ga] = await Promise.all([getSnapshot(), getGaReport(30, false)]);
  const count = (f: MissingField) => snap.branches.filter((b) => b.missing.includes(f)).length;
  const open = snap.branches.filter((b) => b.state === 'open').length;
  const rows = sortWorstFirst(snap.branches);

  return (
    <div className="space-y-[var(--spacing-xl)]">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('dashboard')}</h1>
      {snap.usingFallback && <p className="text-sm text-[var(--color-warning)]">{t('fallbackNote')}</p>}

      <div className="grid grid-cols-2 gap-[var(--spacing-md)] md:grid-cols-4">
        <Stat label={t('totalBranches')} value={snap.branches.length} />
        <Stat label={t('openNow')} value={open} tone="ok" />
        <Stat label={t('missingHours')} value={count('hours')} tone={count('hours') ? 'warn' : undefined} />
        <Stat label={t('missingPhone')} value={count('phone')} tone={count('phone') ? 'warn' : undefined} />
        <Stat label={t('missingPhotos')} value={count('photos')} tone={count('photos') ? 'warn' : undefined} />
        <Stat label={t('missingServices')} value={count('services')} tone={count('services') ? 'warn' : undefined} />
        <Stat label={t('menuItems')} value={snap.menuItems ?? '—'} />
        <Stat label={t('lastEdit')} value={<span className="text-base">{formatDubai(snap.lastEdit, lang)}</span>} />
      </div>

      <Card title={t('health')}>
        <Table>
          <thead>
            <tr>
              <th className={th}>{t('branch')}</th>
              <th className={th}>{t('status')}</th>
              <th className={th}>{t('missing')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td className={td}>
                  <a href={studioEditUrl(b)} target="_blank" rel="noreferrer" className="text-[var(--color-interactive-hover)] underline-offset-2 hover:underline">
                    {lang === 'ar' && b.nameAr ? b.nameAr : b.nameEn}
                  </a>
                </td>
                <td className={td}><StatusBadge state={b.state} t={t} /></td>
                <td className={td}>
                  {b.missing.length === 0 ? (
                    <span className="text-[var(--color-success)]">{t('complete')}</span>
                  ) : (
                    <span className="text-[var(--color-warning)]">{b.missing.map((m) => t(m)).join(' · ')}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <section className="space-y-[var(--spacing-md)]">
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('analytics')}</h2>
        {ga.status === 'ok' ? (
          <GaOverview r={ga.data} t={t} days={30} />
        ) : (
          <ConnectGa t={t} error={ga.status === 'error'} />
        )}
      </section>
    </div>
  );
}
