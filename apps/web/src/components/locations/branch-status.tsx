'use client';

import { useEffect, useState } from 'react';

export type OpeningHours = Partial<Record<string, string | boolean | null>>;

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_AR: Record<string, string> = {
  monday: 'الاثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس',
  friday: 'الجمعة', saturday: 'السبت', sunday: 'الأحد',
};

const toMin = (t?: unknown) => {
  if (typeof t !== 'string' || !/^\d{2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Current weekday + minutes in Asia/Dubai, independent of server/browser TZ. */
function dubaiNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai', weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { day: get('weekday').toLowerCase(), min: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

function slot(h: OpeningHours, day: string) {
  if (h[`${day}Closed`]) return null;
  const o = toMin(h[`${day}Open`]);
  const c = toMin(h[`${day}Close`]);
  return o == null || c == null ? undefined : { o, c };
}

type Status = { state: 'open' | 'closed' | 'unknown'; closesSoon?: boolean; until?: string };

function compute(h: OpeningHours | null): Status {
  if (!h) return { state: 'unknown' };
  const { day, min } = dubaiNow();
  const i = DAYS.indexOf(day as (typeof DAYS)[number]);
  const today = slot(h, day);
  const prev = slot(h, DAYS[(i + 6) % 7]);
  const fmt = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  // Overnight spill-over from yesterday
  if (prev && prev.c < prev.o && min < prev.c) return { state: 'open', until: fmt(prev.c), closesSoon: prev.c - min <= 60 };
  if (today === undefined) return { state: 'unknown' };
  if (today) {
    const close = today.c <= today.o ? today.c + 1440 : today.c;
    if (min >= today.o && min < close) return { state: 'open', until: fmt(close), closesSoon: close - min <= 60 };
    if (min < today.o) return { state: 'closed', until: fmt(today.o) };
  }
  return { state: 'closed' };
}

export function BranchStatus({ hours, isAr }: { hours: OpeningHours | null; isAr: boolean }) {
  const [s, setS] = useState<Status | null>(null);
  useEffect(() => {
    const tick = () => setS(compute(hours));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours]);

  if (!s || s.state === 'unknown') return null;
  const open = s.state === 'open';
  const color = open ? (s.closesSoon ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-red-500';
  const text = open
    ? s.closesSoon
      ? isAr ? `يغلق قريباً · ${s.until}` : `Closes soon · ${s.until}`
      : isAr ? `مفتوح الآن · حتى ${s.until}` : `Open now · until ${s.until}`
    : s.until
      ? isAr ? `مغلق · يفتح ${s.until}` : `Closed · opens ${s.until}`
      : isAr ? 'مغلق اليوم' : 'Closed today';

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[var(--color-brand-espresso,#3B1F0E)] shadow">
      <span className={`relative flex h-2 w-2`}>
        {open && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
      </span>
      {text}
    </span>
  );
}

export function WeeklyHours({ hours, isAr }: { hours: OpeningHours; isAr: boolean }) {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(dubaiNow().day), []);
  return (
    <table className="w-full text-xs">
      <tbody>
        {DAYS.map((d) => {
          const sl = slot(hours, d);
          const label = isAr ? DAY_AR[d] : d.charAt(0).toUpperCase() + d.slice(1, 3);
          const val =
            sl === null
              ? isAr ? 'مغلق' : 'Closed'
              : sl === undefined
                ? '—'
                : `${hours[`${d}Open`]} – ${hours[`${d}Close`]}`;
          return (
            <tr key={d} className={d === today ? 'font-semibold text-[var(--color-brand-espresso,#3B1F0E)]' : 'text-black/60'}>
              <td className="py-0.5 pe-3">{label}</td>
              <td className="py-0.5 text-end tabular-nums" dir="ltr">{val}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** True when the branch is open at this moment (Asia/Dubai). */
export function isOpenNow(h: OpeningHours | null): boolean {
  return compute(h).state === 'open';
}
