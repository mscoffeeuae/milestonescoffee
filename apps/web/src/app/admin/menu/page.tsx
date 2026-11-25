import Image from 'next/image';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';
import { getT } from '@/lib/admin/lang';
import { listCategories, listProducts, writeConfigured } from '@/lib/admin/menu-data';
import { Card, Table, td, th } from '@/components/admin/ui';
import { ReoptimiseButton } from '@/components/admin/reoptimise-button';
import { BulkSelectAll } from '@/components/admin/bulk-select-all';
import { bulkAction, deleteProductAction, toggleActiveAction } from './actions';

const field =
  'rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-base)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]';
const smallBtn =
  'rounded-[var(--radius-md)] border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]';

const MSG = {
  saved: 'msgSaved', updated: 'msgUpdated', deleted: 'msgDeleted', error: 'msgError',
  bulknone: 'msgBulkNone', bulkmany: 'msgBulkTooMany', bulkamount: 'msgBulkAmount', bulkconfirm: 'msgBulkConfirm',
} as const;
const ISSUES = { noar: 'noArabic', hidden: 'hiddenItems', unoptimised: 'unoptimised' } as const;
const ERROR_MSGS = ['error', 'bulknone', 'bulkmany', 'bulkamount', 'bulkconfirm'];

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; msg?: string; issue?: string; n?: string; s?: string }>;
}) {
  await requireAdmin();
  const { q = '', cat = '', msg, issue = '', n, s } = await searchParams;
  const { lang, t } = await getT();
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);

  const needle = q.trim().toLowerCase();
  const list = products.filter((p) => {
    if (cat && p.categoryId !== cat) return false;
    if (issue === 'noar' && p.nameAr?.trim()) return false;
    if (issue === 'hidden' && p.isActive) return false;
    if (issue === 'unoptimised' && !(p.imageUrl && !p.imageMeta)) return false;
    if (needle && !`${p.nameEn} ${p.nameAr ?? ''}`.toLowerCase().includes(needle)) return false;
    return true;
  });
  const msgKey = msg && msg in MSG ? MSG[msg as keyof typeof MSG] : null;
  const issueKey = issue in ISSUES ? ISSUES[issue as keyof typeof ISSUES] : null;

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('menu')} <span className="text-base font-normal text-[var(--color-text-muted)]">({products.length} {t('items')})</span>
        </h1>
        <Link href="/admin/menu/new" className="rounded-[var(--radius-md)] bg-[var(--color-interactive)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-interactive-hover)]">
          + {t('addItem')}
        </Link>
      </div>
      <div className="flex flex-wrap gap-2" aria-label={t('importExport')}>
        <a href="/admin/menu/export?format=csv" className={smallBtn}>{t('exportCsv')}</a>
        <a href="/admin/menu/export?format=xlsx" className={smallBtn}>{t('exportXlsx')}</a>
        <Link href="/admin/menu/import" className={smallBtn}>{t('importMenu')}</Link>
      </div>
      <ReoptimiseButton
        labels={{ button: t('reoptimise'), help: t('reoptimiseHelp'), working: t('reoptimising'), done: t('reoptimiseDone'), skipped: t('skipped'), failed: t('failed') }}
      />

      {!writeConfigured() && <p role="alert" className="text-sm text-[var(--color-warning)]">{t('errConfig')}</p>}
      {msgKey && (
        <p role={ERROR_MSGS.includes(msg ?? '') ? 'alert' : 'status'} className="text-sm" style={{ color: ERROR_MSGS.includes(msg ?? '') ? 'var(--color-error)' : 'var(--color-success)' }}>
          {t(msgKey)}
        </p>
      )}
      {msg === 'bulk' && (
        <p role="status" className="text-sm text-[var(--color-success)]">
          {t('msgBulkDone')} {Number(n) || 0}{Number(s) > 0 ? ` · ${t('msgBulkSkipped')} ${Number(s)}` : ''}
        </p>
      )}
      {issueKey && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t('issueShowing')}: <strong>{t(issueKey)}</strong> ({list.length}) · <Link href="/admin/menu" className="underline hover:text-[var(--color-interactive-hover)]">{t('clearFilter')}</Link>
        </p>
      )}

      <form method="get" className="flex flex-wrap gap-2">
        {issue && <input type="hidden" name="issue" value={issue} />}
        <input type="search" name="q" defaultValue={q} placeholder={t('search')} aria-label={t('search')} className={`${field} min-w-0 flex-1`} />
        <select name="cat" defaultValue={cat} aria-label={t('category')} className={field}>
          <option value="">{t('allCategories')}</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{lang === 'ar' && c.nameAr ? c.nameAr : c.nameEn}</option>
          ))}
        </select>
        <button type="submit" className="rounded-[var(--radius-md)] bg-[var(--color-interactive)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-interactive-hover)]">
          {t('filter')}
        </button>
      </form>

      {/* Bulk toolbar. Row checkboxes join this form via form="bulk", so the per-row forms in the table are not nested. */}
      <form id="bulk" action={bulkAction} aria-label={t('bulkActions')} className="flex flex-wrap items-start gap-2">
        <button type="submit" name="op" value="none" tabIndex={-1} aria-hidden className="hidden" />
        <button type="submit" name="op" value="show" className={smallBtn}>{t('bulkShow')}</button>
        <button type="submit" name="op" value="hide" className={smallBtn}>{t('bulkHide')}</button>
        <details className="relative">
          <summary className={`${smallBtn} cursor-pointer list-none`}>{t('bulkPrice')}</summary>
          <div className="absolute start-0 z-10 mt-1 w-72 max-w-[85vw] space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-3 text-xs shadow-[var(--shadow-md)]">
            <label className="block">
              <span className="mb-1 block text-[var(--color-text-secondary)]">{t('bulkMode')}</span>
              <select name="mode" defaultValue="fixed" className={`${field} w-full`}>
                <option value="fixed">{t('modeFixed')}</option>
                <option value="percent">{t('modePercent')}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[var(--color-text-secondary)]">{t('bulkAmount')}</span>
              <input name="amount" type="number" step="0.01" inputMode="decimal" className={`${field} w-full`} />
            </label>
            <button type="submit" name="op" value="price" className="rounded-[var(--radius-md)] bg-[var(--color-interactive)] px-3 py-1.5 text-white">{t('bulkApplyPrice')}</button>
          </div>
        </details>
        {/* Delete only submits from inside the opened panel, and only with the box ticked. */}
        <details className="relative">
          <summary className={`${smallBtn} cursor-pointer list-none text-[var(--color-error)]`}>{t('bulkDelete')}</summary>
          <div className="absolute start-0 z-10 mt-1 w-72 max-w-[85vw] space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-3 text-xs shadow-[var(--shadow-md)]">
            <p className="text-[var(--color-text-primary)]">{t('bulkDeleteWarn')}</p>
            <label className="flex items-start gap-2"><input type="checkbox" name="confirmDelete" className="mt-0.5" /> {t('bulkUnderstand')}</label>
            <button type="submit" name="op" value="delete" className="rounded-[var(--radius-md)] bg-[var(--color-error)] px-3 py-1.5 text-white">{t('delYes')}</button>
          </div>
        </details>
      </form>

      <Card>
        {list.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('noResults')}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}><BulkSelectAll label={t('selectAll')} /></th>
                <th className={th} />
                <th className={th}>{t('nameEn')}</th>
                <th className={th}>{t('category')}</th>
                <th className={th}>{t('price')}</th>
                <th className={th}>{t('status')}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p._id}>
                  <td className={td}>
                    <input type="checkbox" name="ids" value={p._id} form="bulk" aria-label={`${t('selectItem')}: ${p.nameEn}`} />
                  </td>
                  <td className={td}>
                    {p.imageUrl ? (
                      // Lists use the 600px thumbnail (falls back to the full image for items not yet optimised).
                      <Image
                        src={p.imageThumbUrl ?? p.imageUrl}
                        alt=""
                        width={p.imageMeta?.thumbWidth ?? 80}
                        height={p.imageMeta?.thumbHeight ?? 80}
                        sizes="40px"
                        {...(p.imageLqip ? { placeholder: 'blur' as const, blurDataURL: p.imageLqip } : {})}
                        className="size-10 rounded-[var(--radius-sm)] object-cover"
                      />
                    ) : (
                      <span className="block size-10 rounded-[var(--radius-sm)] bg-[var(--color-bg-muted)]" />
                    )}
                  </td>
                  <td className={td}>
                    <div className="font-medium">{lang === 'ar' && p.nameAr ? p.nameAr : p.nameEn}</div>
                    <div className="text-xs text-[var(--color-text-muted)]" dir="auto">{lang === 'ar' ? p.nameEn : p.nameAr}</div>
                  </td>
                  <td className={td}>{p.categoryEn ?? '—'}</td>
                  <td className={`${td} tabular-nums`}>{p.displayPriceAed != null ? p.displayPriceAed : '—'}</td>
                  <td className={td}>
                    <span style={{ color: p.isActive ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      {p.isActive ? t('visible') : t('hidden')}
                    </span>
                  </td>
                  <td className={td}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link href={`/admin/menu/${encodeURIComponent(p._id)}`} className={smallBtn}>{t('editItem')}</Link>
                      <form action={toggleActiveAction}>
                        <input type="hidden" name="id" value={p._id} />
                        <input type="hidden" name="to" value={p.isActive ? '0' : '1'} />
                        <button type="submit" className={smallBtn}>{p.isActive ? t('hide') : t('show')}</button>
                      </form>
                      {/* No-JS confirmation: delete only submits from inside the opened panel */}
                      <details className="relative">
                        <summary className={`${smallBtn} cursor-pointer list-none text-[var(--color-error)]`}>{t('del')}</summary>
                        <form action={deleteProductAction} className="absolute end-0 z-10 mt-1 w-56 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-3 text-xs shadow-[var(--shadow-md)]">
                          <p className="mb-2 text-[var(--color-text-primary)]">{t('delConfirm')}</p>
                          <input type="hidden" name="id" value={p._id} />
                          <button type="submit" className="rounded-[var(--radius-md)] bg-[var(--color-error)] px-2.5 py-1 text-white">{t('delYes')}</button>
                        </form>
                      </details>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
