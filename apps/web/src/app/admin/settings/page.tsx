import { changePasswordAction, logoutAction } from '../actions';
import { requireAdmin } from '@/lib/admin/guard';
import { getT } from '@/lib/admin/lang';
import { Card, Table, td, th } from '@/components/admin/ui';

/** Names only — values are never rendered. */
const ENV_VARS = [
  'ADMIN_PASSWORD',
  'ADMIN_SESSION_SECRET',
  'ADMIN_AUTH_FILE',
  'SANITY_API_WRITE_TOKEN',
  'GA_PROPERTY_ID',
  'GA_SERVICE_ACCOUNT_JSON',
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SANITY_STUDIO_URL',
  'NEXT_PUBLIC_SITE_URL',
] as const;

const PW_MESSAGES = {
  ok: 'pwOk', wrong: 'pwWrong', mismatch: 'pwMismatch', short: 'pwShort', same: 'pwSame', error: 'pwError',
} as const;

const input =
  'w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-base)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ pw?: string }> }) {
  await requireAdmin();
  const { pw } = await searchParams;
  const { t } = await getT();
  const msgKey = pw && pw in PW_MESSAGES ? PW_MESSAGES[pw as keyof typeof PW_MESSAGES] : null;
  const commit = process.env['GIT_COMMIT_SHA'];

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('settings')}</h1>
      <Card title={t('changePassword')}>
        {msgKey && (
          <p
            role={pw === 'ok' ? 'status' : 'alert'}
            className="mb-3 text-sm"
            style={{ color: pw === 'ok' ? 'var(--color-success)' : 'var(--color-error)' }}
          >
            {t(msgKey)}
          </p>
        )}
        <form action={changePasswordAction} className="max-w-sm space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-text-secondary)]">{t('currentPassword')}</span>
            <input type="password" name="current" required autoComplete="current-password" className={input} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-text-secondary)]">{t('newPassword')}</span>
            <input type="password" name="next" required minLength={12} autoComplete="new-password" className={input} />
            <span className="mt-1 block text-xs text-[var(--color-text-muted)]">{t('pwHint')}</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-text-secondary)]">{t('confirmPassword')}</span>
            <input type="password" name="confirm" required minLength={12} autoComplete="new-password" className={input} />
          </label>
          <button type="submit" className="rounded-[var(--radius-md)] bg-[var(--color-interactive)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-interactive-hover)]">
            {t('changePassword')}
          </button>
        </form>
        <form action={logoutAction} className="mt-4 border-t border-[var(--color-border)] pt-3">
          <button type="submit" className="text-sm text-[var(--color-interactive-hover)] underline underline-offset-2">
            {t('signOutLink')}
          </button>
        </form>
      </Card>
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
