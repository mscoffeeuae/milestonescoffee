import { requireAdmin } from '@/lib/admin/guard';
import { formatDubai, getT } from '@/lib/admin/lang';
import { listOffers, type OfferStatus } from '@/lib/admin/offers-data';
import { Card, Table, td, th } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

const ORDER: OfferStatus[] = ['active', 'upcoming', 'expired', 'inactive'];
const LABEL = { active: 'offerActive', upcoming: 'offerUpcoming', expired: 'offerExpired', inactive: 'offerInactive' } as const;
const TONE: Record<OfferStatus, string> = {
  active: 'var(--color-success)', upcoming: 'var(--color-info)', expired: 'var(--color-text-muted)', inactive: 'var(--color-warning)',
};

export default async function OffersPage() {
  await requireAdmin();
  const { lang, t } = await getT();
  const offers = await listOffers();
  const studio = (process.env['SANITY_STUDIO_URL'] ?? '').replace(/\/$/, '');

  return (
    <div className="space-y-[var(--spacing-lg)]">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t('offersTitle')}</h1>
      <p className="max-w-2xl text-sm text-[var(--color-text-secondary)]">{t('offersHelp')}</p>

      <div className="grid grid-cols-2 gap-[var(--spacing-md)] md:grid-cols-4">
        {ORDER.map((s) => (
          <div key={s} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-[var(--spacing-md)]">
            <div className="text-xs text-[var(--color-text-muted)]">{t(LABEL[s])}</div>
            <div className="mt-1 text-2xl font-semibold" style={{ color: TONE[s] }}>{offers.filter((o) => o.status === s).length}</div>
          </div>
        ))}
      </div>

      <Card>
        {offers.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('noOffers')}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>{t('offers')}</th>
                <th className={th}>{t('status')}</th>
                <th className={th}>{t('validFromL')}</th>
                <th className={th}>{t('validUntilL')}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {[...offers].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)).map((o) => (
                <tr key={o._id}>
                  <td className={td}>{lang === 'ar' && o.titleAr ? o.titleAr : o.titleEn}</td>
                  <td className={td}><span className="font-medium" style={{ color: TONE[o.status] }}>{t(LABEL[o.status])}</span></td>
                  <td className={`${td} whitespace-nowrap`}>{formatDubai(o.validFrom, lang)}</td>
                  <td className={`${td} whitespace-nowrap`}>{o.validUntil ? formatDubai(o.validUntil, lang) : t('openEnded')}</td>
                  <td className={td}>
                    {studio && (
                      <a href={`${studio}/structure/offer;${o._id}`} target="_blank" rel="noreferrer" className="whitespace-nowrap text-[var(--color-interactive-hover)] hover:underline">{t('edit')}</a>
                    )}
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
