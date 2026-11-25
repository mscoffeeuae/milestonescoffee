import { requireAdmin } from '@/lib/admin/guard';
import { formatDubai, getT } from '@/lib/admin/lang';
import { ACTIONS, MAX_ENTRIES, listActivity, type ActivityAction } from '@/lib/admin/activity';
import { Card, Table, td, th } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

const field =
  'rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-base)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]';
const TONE: Record<ActivityAction, string> = {
  create: 'var(--color-success)', edit: 'var(--color-info)', hide: 'var(--color-warning)', show: 'var(--color-success)',
  delete: 'var(--color-error)', price: 'var(--color-info)', import: 'var(--color-info)', settings: 'var(--color-text-secondary)',
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const { action = '', from = '', to = '' } = await searchParams;
  const { lang, t } = await getT();
  const { entries, total } = await listActivity({ action, from, to, limit: 300 });
  const filtered = Boolean(action || from || to);

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('activity')}</h1>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--color-text-secondary)]">{t('filterType')}</span>
          <select name="action" defaultValue={action} className={field}>
            <option value="">{t('allActions')}</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{t(`act_${a}` as const)}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--color-text-secondary)]">{t('dateFrom')}</span>
          <input type="date" name="from" defaultValue={from} className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--color-text-secondary)]">{t('dateTo')}</span>
          <input type="date" name="to" defaultValue={to} className={field} />
        </label>
        <button type="submit" className="rounded-[var(--radius-md)] bg-[var(--color-interactive)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-interactive-hover)]">{t('apply')}</button>
        {filtered && <a href="/admin/activity" className="px-2 py-2 text-sm underline">{t('reset')}</a>}
      </form>

      <p className="text-sm text-[var(--color-text-muted)]">
        {t('activityShown')} {entries.length} {t('of')} {total} · {t('activityKept').replace('1,000', MAX_ENTRIES.toLocaleString('en-US'))}
      </p>

      <Card>
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('activityEmpty')}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>{t('activityWhen')}</th>
                <th className={th}>{t('activityAction')}</th>
                <th className={th}>{t('activityItem')}</th>
                <th className={th}>{t('activityDetail')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e._id}>
                  <td className={`${td} whitespace-nowrap`}>{formatDubai(e.at, lang)}</td>
                  <td className={td}><span className="font-medium" style={{ color: TONE[e.action] }}>{t(`act_${e.action}` as const)}</span></td>
                  <td className={td}>{e.label}</td>
                  <td className={`${td} break-words text-xs text-[var(--color-text-secondary)]`}>{e.detail ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
