'use client';

import { useEffect, useState } from 'react';
import { isOpenNow, type OpeningHours } from '@/components/locations/branch-status';

/**
 * Live "branches open now" strip. Reuses the branch-page status logic (Asia/Dubai time)
 * and recomputes every minute. Renders nothing until hours are known client-side.
 */
export function OpenNowBanner({ hours, locale }: { hours: (OpeningHours | null)[]; locale: string }) {
  const isAr = locale === 'ar';
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setOpen(hours.filter((h) => isOpenNow(h)).length);
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours]);

  const total = hours.filter(Boolean).length;
  if (open === null || total === 0) return null;

  const live = open > 0;
  const text = live
    ? isAr ? `${open} من ${total} فرعاً مفتوح الآن` : `${open} of ${total} branches open now`
    : isAr ? 'جميع الفروع مغلقة حالياً' : 'All branches are closed right now';

  return (
    <div role="status" style={{ background: 'var(--color-brand-espresso)', color: 'var(--color-brand-ivory)' }}>
      <div
        className="container mx-auto"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-lg)', fontSize: '0.9rem' }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontWeight: 600 }}>
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: live ? 'var(--color-success)' : 'var(--color-error)', boxShadow: live ? '0 0 0 3px rgba(45,122,74,.35)' : 'none' }} />
          {text}
        </span>
        <a href={`/${locale}/locations`} style={{ color: 'var(--color-brand-bronze-light)', fontWeight: 600, textDecoration: 'underline' }}>
          {isAr ? 'اعرض الفروع' : 'See branches'}
        </a>
      </div>
    </div>
  );
}
