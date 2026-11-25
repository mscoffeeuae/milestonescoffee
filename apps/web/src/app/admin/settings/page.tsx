import { requireAdmin } from '@/lib/admin/guard';
import { getT } from '@/lib/admin/lang';
import { Card, Table, td, th } from '@/components/admin/ui';

/** Names only — values are never rendered. */
const ENV_VARS = [
  'ADMIN_PASSWORD',
  'ADMIN_SESSION_SECRET',
  'GA_PROPERTY_ID',
  'GA_SERVICE_ACCOUNT_JSON',
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SANITY_STUDIO_URL',
  'NEXT_PUBLIC_SITE_URL',
] as const;

export default async function SettingsPage() {
  await requireAdmin();
  const { t } = await getT();
  const commit = process.env['GIT_COMMIT_SHA'];

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('settings')}</h1>
      <Card title={t('deployedCommit')}>
        <code className="text-sm" dir="ltr">{commit ? commit.slice(0, 12) : '—'}</code>
        {commit && <div className="mt-1 break-all text-xs text-[var(--color-text-muted)]" dir="ltr">{commit}</div>}
      </Card>
      <Card title={t('envStatus')}>
        <p className="mb-3 text-xs text-[var(--color-text-muted)]">{t('valuesHidden')}</p>
        <Table>
          <tbody>
            {ENV_VARS.map((name) => {
              const set = Boolean(process.env[name]?.trim());
              return (
                <tr key={name}>
                  <th scope="row" className={`${th} font-mono`} dir="ltr">{name}</th>
                  <td className={td} style={{ color: set ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {set ? t('isSet') : t('notSet')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
