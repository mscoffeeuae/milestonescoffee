import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';
import { getT } from '@/lib/admin/lang';
import { EMIRATE_LABELS, getSnapshot, studioEditUrl } from '@/lib/admin/data';
import { Card, StatusBadge, Table, td, th } from '@/components/admin/ui';

const field =
  'rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-base)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]';

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; emirate?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q = '', emirate = '', status = '' } = await searchParams;
  const { lang, t } = await getT();
  const snap = await getSnapshot();

  const needle = q.trim().toLowerCase();
  const list = snap.branches.filter((b) => {
    if (emirate && b.emirate !== emirate) return false;
    if (status === 'open' && b.state !== 'open') return false;
    if (status === 'closed' && b.state !== 'closed') return false;
    if (needle && !`${b.nameEn} ${b.nameAr ?? ''} ${b.slug}`.toLowerCase().includes(needle)) return false;
    return true;
  });
  const emirates = [...new Set(snap.branches.map((b) => b.emirate).filter(Boolean))];

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('branches')}</h1>
      {snap.usingFallback && <p className="text-sm text-[var(--color-warning)]">{t('fallbackNote')}</p>}

      <form method="get" className="flex flex-wrap gap-2">
        <input type="search" name="q" defaultValue={q} placeholder={t('search')} aria-label={t('search')} className={`${field} min-w-0 flex-1`} />
        <select name="emirate" defaultValue={emirate} aria-label={t('emirate')} className={field}>
          <option value="">{t('allEmirates')}</option>
          {emirates.map((e) => (
            <option key={e} value={e}>{EMIRATE_LABELS[e]?.[lang] ?? e}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} aria-label={t('status')} className={field}>
          <option value="">{t('allStatus')}</option>
          <option value="open">{t('open')}</option>
          <option value="closed">{t('closed')}</option>
        </select>
        <button type="submit" className="rounded-[var(--radius-md)] bg-[var(--color-interactive)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-interactive-hover)]">
          {t('filter')}
        </button>
      </form>

      <Card>
        {list.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('noResults')}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>{t('branch')}</th>
                <th className={th}>{t('emirate')}</th>
                <th className={th}>{t('status')}</th>
                <th className={th}>{t('missing')}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <td className={td}>{lang === 'ar' && b.nameAr ? b.nameAr : b.nameEn}</td>
                  <td className={td}>{EMIRATE_LABELS[b.emirate]?.[lang] ?? b.emirate}</td>
                  <td className={td}><StatusBadge state={b.state} t={t} /></td>
                  <td className={td}>{b.missing.length ? b.missing.map((m) => t(m)).join(' · ') : '—'}</td>
                  <td className={td}>
                    {!b.isFallback && (
                      <Link href={`/admin/branches/${encodeURIComponent(b.id)}/gallery`} className="me-3 whitespace-nowrap text-[var(--color-interactive-hover)] hover:underline">
                        {t('gallery')}
                      </Link>
                    )}
                    <a href={studioEditUrl(b)} target="_blank" rel="noreferrer" className="whitespace-nowrap text-[var(--color-interactive-hover)] hover:underline">
                      {t('edit')}
                    </a>
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
