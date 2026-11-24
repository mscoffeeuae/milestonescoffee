'use client';

import { useState } from 'react';

export interface NearbyPoint {
  name: string;
  slug: string;
  lat: number;
  lng: number;
}

interface BranchToolsProps {
  isAr: boolean;
  slug: string;
  name: string;
  address: string | null;
  coords: { lat: number; lng: number } | null;
  others: NearbyPoint[];
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLng = (b.lng - a.lng) * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatKm(km: number, isAr: boolean): string {
  if (km < 1) return `${Math.round(km * 1000)} ${isAr ? 'م' : 'm'}`;
  return `${km.toFixed(1)} ${isAr ? 'كم' : 'km'}`;
}

export function BranchTools({ isAr, slug, name, address, coords, others }: BranchToolsProps) {
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState('');

  const say = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 2500);
  };

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      say(isAr ? 'تم نسخ العنوان' : 'Address copied');
    } catch {
      say(isAr ? 'حدّد العنوان لنسخه' : 'Select the address to copy');
    }
  };

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} · Milestones Coffee`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      say(isAr ? 'تم نسخ الرابط' : 'Link copied');
    } catch {
      // Share sheet dismissed or unavailable; nothing else to do.
    }
  };

  const locate = () => {
    if (!navigator.geolocation) {
      say(isAr ? 'الموقع غير متاح على هذا الجهاز' : 'Location is not available on this device');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setHere({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        say(isAr ? 'لم يتم السماح بالوصول إلى الموقع' : 'Location permission was not granted');
      },
      { timeout: 8000 },
    );
  };

  const distance = here && coords ? distanceKm(here, coords) : null;

  const nearby = here
    ? others
        .filter((o) => o.slug !== slug)
        .map((o) => ({ ...o, km: distanceKm(here, o) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 3)
    : [];

  const btn =
    'inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 text-sm font-semibold transition';

  return (
    <section
      aria-labelledby="branch-tools-h"
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 id="branch-tools-h" className="mb-3 text-lg font-bold text-[var(--color-brand-espresso,#3B1F0E)]">
        {isAr ? 'أدوات الفرع' : 'Branch tools'}
      </h2>

      <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-[var(--color-brand-ivory,#F5F0E8)] p-3">
          <dt className="text-xs uppercase tracking-wide text-black/50">{isAr ? 'المسافة' : 'Distance'}</dt>
          <dd className="mt-1 font-semibold tabular-nums">
            {distance !== null
              ? `${formatKm(distance, isAr)} ${isAr ? 'منك' : 'away'}`
              : isAr
                ? 'غير معروفة'
                : 'Not set'}
          </dd>
        </div>
        <div className="rounded-xl bg-[var(--color-brand-ivory,#F5F0E8)] p-3">
          <dt className="text-xs uppercase tracking-wide text-black/50">{isAr ? 'الهاتف' : 'Phone'}</dt>
          <dd className="mt-1 font-semibold">{isAr ? 'انظر أعلاه' : 'See above'}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={locate} disabled={locating} aria-pressed={here !== null} className={`${btn} border-[var(--color-brand-espresso,#3B1F0E)] text-[var(--color-brand-espresso,#3B1F0E)] hover:bg-[var(--color-brand-espresso,#3B1F0E)] hover:text-white disabled:opacity-60`}>
          {locating ? (isAr ? 'جارٍ التحديد…' : 'Locating…') : isAr ? 'استخدم موقعي' : 'Use my location'}
        </button>
        {address && (
          <button type="button" onClick={copyAddress} className={`${btn} border-[var(--color-brand-espresso,#3B1F0E)] text-[var(--color-brand-espresso,#3B1F0E)] hover:bg-[var(--color-brand-espresso,#3B1F0E)] hover:text-white`}>
            {isAr ? 'نسخ العنوان' : 'Copy address'}
          </button>
        )}
        <button type="button" onClick={share} className={`${btn} border-[var(--color-brand-espresso,#3B1F0E)] text-[var(--color-brand-espresso,#3B1F0E)] hover:bg-[var(--color-brand-espresso,#3B1F0E)] hover:text-white`}>
          {isAr ? 'مشاركة' : 'Share'}
        </button>
      </div>

      <p role="status" className="mt-2 min-h-[1.25em] text-xs text-green-800">{msg}</p>

      {here && nearby.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-brand-espresso,#3B1F0E)]">
            {isAr ? 'فروع قريبة' : 'Nearby branches'}
          </h3>
          <ul role="list" className="grid gap-1">
            {nearby.map((o) => (
              <li key={o.slug}>
                <a
                  href={`/${isAr ? 'ar' : 'en'}/locations/${o.slug}`}
                  className="flex justify-between gap-4 rounded px-2 py-2 text-sm no-underline hover:bg-[var(--color-brand-ivory,#F5F0E8)]"
                >
                  <span>{o.name}</span>
                  <span className="tabular-nums text-black/50">{formatKm(o.km, isAr)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
