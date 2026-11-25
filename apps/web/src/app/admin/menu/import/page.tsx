import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';
import { getT } from '@/lib/admin/lang';
import { listCategories, listProducts, writeConfigured } from '@/lib/admin/menu-data';
import { buildPlan, type PlanAction } from '@/lib/admin/menu-import';
import { load, loadSummary, validToken } from '@/lib/admin/menu-import-store';
import { Card, Stat, Table, td, th } from '@/components/admin/ui';
import { cancelImportAction, confirmImportAction } from './actions';

const ERRORS: Record<string, string> = {
  nosheet: 'Choose a .csv or .xlsx file to import.',
  sheettype: 'The spreadsheet must be a .csv or .xlsx file.',
  sheetsize: 'The spreadsheet is larger than 2 MB.',
  ziptype: 'The images file must be a valid .zip archive.',
  zipsize: 'The ZIP is larger than 50 MB.',
  toolarge: 'The upload is too large (limits: 2 MB spreadsheet, 50 MB ZIP).',
  upload: 'The upload could not be read. Try again.',
  expired: 'That import has expired or was already cancelled. Upload the files again.',
  invalid: 'The file could not be imported. Upload it again to see the problem.',
  config: 'Saving is disabled: SANITY_API_WRITE_TOKEN is not set on the server.',
};

const btn = 'rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]';
const primary = 'rounded-[var(--radius-md)] bg-[var(--color-interactive)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-interactive-hover)]';
const TONE: Record<PlanAction, string> = {
  create: 'var(--color-success)', update: 'var(--color-info)', unchanged: 'var(--color-text-muted)', error: 'var(--color-error)',
};

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ t?: string; err?: string; done?: string }> }) {
  await requireAdmin();
  const { t: token, err, done } = await searchParams;
  const { t } = await getT();
  const errMsg = err ? ERRORS[err] : null;

  /* Result */
  if (done && validToken(token)) {
    const s = await loadSummary(token);
    return (
      <div className="space-y-[var(--spacing-lg)]">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('importDone')}</h1>
        {s ? (
          <>
            <div className="grid grid-cols-2 gap-[var(--spacing-md)] md:grid-cols-4">
              <Stat label={t('created')} value={s.created} tone="ok" />
              <Stat label={t('updated')} value={s.updated} />
              <Stat label={t('skipped')} value={s.skipped} />
              <Stat label={t('failed')} value={s.failed} tone={s.failed ? 'warn' : undefined} />
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('skipped')}: {s.unchanged} {t('unchangedN').toLowerCase()}, {s.skippedInvalid} {t('errorsN').toLowerCase()}.
            </p>
            {s.failures.length > 0 && (
              <Card title={t('failed')}>
                <ul className="space-y-1 text-sm text-[var(--color-error)]">
                  {s.failures.map((f) => <li key={f.line}>{t('row')} {f.line} ({f.name}): {f.message}</li>)}
                </ul>
              </Card>
            )}
          </>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">{ERRORS['expired']}</p>
        )}
        <div className="flex gap-2">
          <Link href="/admin/menu" className={primary}>{t('backToMenu')}</Link>
          <Link href="/admin/menu/import" className={btn}>{t('importAnother')}</Link>
        </div>
      </div>
    );
  }

  /* Preview */
  if (validToken(token)) {
    const staged = await load(token);
    if (!staged) {
      return (
        <div className="space-y-4">
          <p role="alert" className="text-sm text-[var(--color-error)]">{ERRORS['expired']}</p>
          <Link href="/admin/menu/import" className={btn}>{t('importAnother')}</Link>
        </div>
      );
    }
    const [products, categories] = await Promise.all([listProducts(), listCategories()]);
    const plan = await buildPlan(staged.sheet, staged.ext, staged.zip, products, categories);
    const writable = plan.counts.create + plan.counts.update;

    return (
      <div className="space-y-[var(--spacing-lg)]">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('preview')}</h1>
        {errMsg && <p role="alert" className="text-sm text-[var(--color-error)]">{errMsg}</p>}
        {plan.fatal ? (
          <>
            <p role="alert" className="text-sm text-[var(--color-error)]">{plan.fatal}</p>
            <form action={cancelImportAction}>
              <input type="hidden" name="t" value={token} />
              <button type="submit" className={btn}>{t('importAnother')}</button>
            </form>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-[var(--spacing-md)] md:grid-cols-4">
              <Stat label={t('willCreate')} value={plan.counts.create} tone="ok" />
              <Stat label={t('willUpdate')} value={plan.counts.update} />
              <Stat label={t('unchangedN')} value={plan.counts.unchanged} />
              <Stat label={t('errorsN')} value={plan.counts.error} tone={plan.counts.error ? 'warn' : undefined} />
            </div>
            <Card>
              <Table>
                <thead>
                  <tr>
                    <th className={th}>{t('row')}</th>
                    <th className={th}>{t('nameEn')}</th>
                    <th className={th}>{t('action')}</th>
                    <th className={th}>{t('details')}</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.rows.map((r) => (
                    <tr key={r.line}>
                      <td className={`${td} tabular-nums`}>{r.line}</td>
                      <td className={td}>{r.nameEn || '—'}</td>
                      <td className={td}><span style={{ color: TONE[r.action], fontWeight: 600 }}>{r.action}</span></td>
                      <td className={`${td} text-xs`}>
                        {r.action === 'error' && <span className="text-[var(--color-error)]">{r.errors.join('; ')}</span>}
                        {r.action === 'update' && <span>{r.changes.join(', ')}</span>}
                        {r.action === 'create' && <span>{r.image ? `image: ${r.imageName}` : ''}{r.input?.isActive ? '' : ' hidden'}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
            {!writeConfigured() && <p role="alert" className="text-sm text-[var(--color-warning)]">{ERRORS['config']}</p>}
            <p className="text-sm text-[var(--color-text-secondary)]">{t('confirmNote')}</p>
            <div className="flex gap-2">
              <form action={confirmImportAction}>
                <input type="hidden" name="t" value={token} />
                <button type="submit" disabled={writable === 0 || !writeConfigured()} className={`${primary} disabled:cursor-not-allowed disabled:opacity-50`}>
                  {t('confirmImport')} ({writable})
                </button>
              </form>
              <form action={cancelImportAction}>
                <input type="hidden" name="t" value={token} />
                <button type="submit" className={btn}>{t('cancel')}</button>
              </form>
            </div>
          </>
        )}
      </div>
    );
  }

  /* Step 1 */
  return (
    <div className="space-y-[var(--spacing-lg)]">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('importMenu')}</h1>
      {errMsg && <p role="alert" className="text-sm text-[var(--color-error)]">{errMsg}</p>}
      <Card title={t('importStep1')}>
        <p className="mb-4 max-w-2xl text-sm text-[var(--color-text-secondary)]">{t('importRules')}</p>
        <form action="/admin/menu/import/upload" method="post" encType="multipart/form-data" className="max-w-xl space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-text-secondary)]">{t('sheetFile')}</span>
            <input type="file" name="sheet" required accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="text-sm" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-text-secondary)]">{t('zipFile')}</span>
            <input type="file" name="images" accept=".zip,application/zip" className="text-sm" />
          </label>
          <div className="flex gap-2">
            <button type="submit" className={primary}>{t('preview')}</button>
            <Link href="/admin/menu" className={btn}>{t('cancel')}</Link>
          </div>
        </form>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
          <a href="/admin/menu/export?format=csv&template=1" className={btn}>{t('templateCsv')}</a>
          <a href="/admin/menu/export?format=xlsx&template=1" className={btn}>{t('templateXlsx')}</a>
        </div>
      </Card>
    </div>
  );
}
