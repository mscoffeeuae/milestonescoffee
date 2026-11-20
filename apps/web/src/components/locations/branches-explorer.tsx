'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { BranchStatus, WeeklyHours, isOpenNow, type OpeningHours } from './branch-status';

export interface ExplorerBranch {
  _id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  emirate: string;
  addressEn: string | null;
  addressAr: string | null;
  googleMapsUrl: string | null;
  coordinates: { lat: number; lng: number } | null;
  openingHours: OpeningHours | null;
  openingHoursNoteEn: string | null;
  openingHoursNoteAr: string | null;
  services: string[] | null;
  phone: string | null;
}

export const EMIRATE_LABELS: Record<string, [string, string]> = {
  'abu-dhabi': ['Abu Dhabi', 'أبوظبي'],
  dubai: ['Dubai', 'دبي'],
  sharjah: ['Sharjah', 'الشارقة'],
  ajman: ['Ajman', 'عجمان'],
  'umm-al-quwain': ['Umm Al Quwain', 'أم القيوين'],
  'ras-al-khaimah': ['Ras Al Khaimah', 'رأس الخيمة'],
  fujairah: ['Fujairah', 'الفجيرة'],
};

const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

let leafletPromise: Promise<any> | null = null;
function loadLeaflet(): Promise<any> {
  const w = window as unknown as { L?: unknown };
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.dataset.leaflet = '1';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve(w.L);
    script.onerror = () => reject(new Error('leaflet failed to load'));
    document.head.appendChild(script);
  });
  return leafletPromise;
}

function BranchMap({
  branches,
  isAr,
  onPick,
}: {
  branches: ExplorerBranch[];
  isAr: boolean;
  onPick: (slug: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layer = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !el.current) return;
        if (!map.current) {
          map.current = L.map(el.current, { scrollWheelZoom: false }).setView([24.45, 54.5], 9);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap',
          }).addTo(map.current);
          layer.current = L.layerGroup().addTo(map.current);
        }
        layer.current.clearLayers();
        const pts: [number, number][] = [];
        for (const b of branches) {
          if (!b.coordinates) continue;
          const icon = L.divIcon({
            className: '',
            html: '<div style="width:26px;height:26px;border-radius:9999px;background:#3B1F0E;border:3px solid #C9A87C;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });
          L.marker([b.coordinates.lat, b.coordinates.lng], { icon })
            .bindTooltip(isAr ? b.nameAr : b.nameEn)
            .on('click', () => onPick(b.slug))
            .addTo(layer.current);
          pts.push([b.coordinates.lat, b.coordinates.lng]);
        }
        if (pts.length) map.current.fitBounds(pts, { padding: [30, 30], maxZoom: 13 });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [branches, isAr, onPick]);

  return (
    <div
      ref={el}
      role="region"
      aria-label={isAr ? 'خريطة الفروع' : 'Branch map'}
      className="h-80 w-full overflow-hidden rounded-2xl ring-1 ring-black/5 md:h-[28rem]"
    />
  );
}

export function BranchesExplorer({ branches, locale }: { branches: ExplorerBranch[]; locale: 'en' | 'ar' }) {
  const isAr = locale === 'ar';
  const [query, setQuery] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [user, setUser] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  // Re-evaluate open/closed every minute
  useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const findNearest = () => {
    if (!('geolocation' in navigator)) {
      setGeoError(isAr ? 'المتصفح لا يدعم تحديد الموقع' : 'Your browser cannot share location');
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUser({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError(isAr ? 'تعذّر تحديد موقعك' : 'Could not get your location');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const copyAddress = async (b: ExplorerBranch) => {
    const text = (isAr ? b.addressAr : b.addressEn) ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(b.slug);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return branches
      .map((b) => ({
        ...b,
        km: user && b.coordinates ? distanceKm(user, b.coordinates) : null,
      }))
      .filter((b) => {
        if (q) {
          const hay = `${b.nameEn} ${b.nameAr} ${b.addressEn ?? ''} ${b.addressAr ?? ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (openOnly && !isOpenNow(b.openingHours)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.km != null && b.km != null) return a.km - b.km;
        return 0;
      });
    // `now` makes the open-only filter refresh each minute
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, query, openOnly, user, now]);

  const nearest = user ? visible.filter((b) => b.km != null).slice(0, 3) : [];

  const groups = useMemo(() => {
    const m = new Map<string, typeof visible>();
    for (const b of visible) m.set(b.emirate, [...(m.get(b.emirate) ?? []), b]);
    return [...m.entries()];
  }, [visible]);

  const onPick = (slug: string) => {
    document.getElementById(`b-${slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

  return (
    <div className="space-y-10">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-black/5 bg-[var(--color-brand-ivory,#F5F0E8)]/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="container mx-auto flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">{isAr ? 'ابحث عن فرع' : 'Search branches'}</span>
            <span aria-hidden className="absolute inset-y-0 start-3 flex items-center text-[var(--color-brand-bronze,#A0784A)]">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAr ? 'ابحث باسم الفرع أو العنوان…' : 'Search by name or address…'}
              className="w-full rounded-full border border-black/10 bg-white ps-9 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-gold,#C9A87C)]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={openOnly}
              onClick={() => setOpenOnly((v) => !v)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                openOnly ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-black/10 bg-white hover:border-emerald-600'
              }`}
            >
              ● {isAr ? 'مفتوح الآن' : 'Open now'}
            </button>
            <button
              type="button"
              onClick={findNearest}
              disabled={locating}
              className="rounded-full bg-[var(--color-brand-espresso,#3B1F0E)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-bronze,#A0784A)] disabled:opacity-60"
            >
              {locating ? (isAr ? 'جارٍ التحديد…' : 'Locating…') : user ? (isAr ? 'تحديث الأقرب' : 'Refresh nearest') : (isAr ? 'أقرب فرع إليّ' : 'Find nearest')}
            </button>
          </div>
        </div>
        {geoError && <p role="alert" className="container mx-auto mt-2 text-xs text-red-700">{geoError}</p>}
      </div>

      <p className="text-sm text-black/50" aria-live="polite">
        {isAr ? `عرض ${visible.length} من ${branches.length} فرع` : `Showing ${visible.length} of ${branches.length} branches`}
      </p>

      {/* Nearest strip */}
      {nearest.length > 0 && (
        <section aria-labelledby="near-h" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--color-brand-gold,#C9A87C)]/40">
          <h2 id="near-h" className="mb-4 text-xl font-bold text-[var(--color-brand-espresso,#3B1F0E)]">
            {isAr ? 'أقرب ٣ فروع إليك' : 'Your 3 nearest branches'}
          </h2>
          <ol className="grid gap-3 md:grid-cols-3" role="list">
            {nearest.map((b, i) => (
              <li key={b._id}>
                <button
                  type="button"
                  onClick={() => onPick(b.slug)}
                  className="flex w-full items-center gap-3 rounded-xl bg-[var(--color-brand-ivory,#F5F0E8)] p-3 text-start transition hover:ring-2 hover:ring-[var(--color-brand-gold,#C9A87C)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-espresso,#3B1F0E)] text-sm font-bold text-white">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-[var(--color-brand-espresso,#3B1F0E)]">{isAr ? b.nameAr : b.nameEn}</span>
                    <span className="text-xs text-black/60">{fmtKm(b.km!)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Map */}
      {visible.some((b) => b.coordinates) && <BranchMap branches={visible} isAr={isAr} onPick={onPick} />}

      {/* Listing */}
      {groups.length > 0 ? (
        groups.map(([emirate, list]) => (
          <section key={emirate} id={`emirate-${emirate}`} className="scroll-mt-40" aria-labelledby={`h-${emirate}`}>
            <div className="mb-6 flex items-end justify-between border-b border-[var(--color-brand-gold,#C9A87C)]/40 pb-3">
              <h2 id={`h-${emirate}`} className="text-2xl md:text-3xl font-bold text-[var(--color-brand-espresso,#3B1F0E)]">
                {EMIRATE_LABELS[emirate]?.[isAr ? 1 : 0] ?? emirate}
              </h2>
              <span className="text-sm text-black/40">
                {list.length} {isAr ? 'فرع' : list.length === 1 ? 'branch' : 'branches'}
              </span>
            </div>

            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" role="list">
              {list.map((b) => {
                const name = isAr ? b.nameAr : b.nameEn;
                const address = isAr ? b.addressAr : b.addressEn;
                const note = isAr ? b.openingHoursNoteAr : b.openingHoursNoteEn;
                return (
                  <li
                    key={b._id}
                    id={`b-${b.slug}`}
                    className="group flex scroll-mt-40 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[var(--color-brand-espresso,#3B1F0E)] to-[var(--color-brand-bronze,#A0784A)]">
                      <span aria-hidden className="absolute inset-0 flex items-center justify-center text-5xl text-[var(--color-brand-gold,#C9A87C)]/60">☕</span>
                      <div className="absolute start-3 top-3">
                        <BranchStatus hours={b.openingHours} isAr={isAr} />
                      </div>
                      {b.km != null && (
                        <span className="absolute end-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[var(--color-brand-espresso,#3B1F0E)] shadow">
                          {fmtKm(b.km)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-semibold text-[var(--color-brand-espresso,#3B1F0E)]">
                        <Link href={`/${locale}/locations/${b.slug}`} className="no-underline hover:underline">
                          {name}
                        </Link>
                      </h3>
                      {!isAr && b.nameAr && <p className="text-sm text-black/40" dir="rtl" lang="ar">{b.nameAr}</p>}
                      {address && (
                        <address className="mt-2 flex gap-2 text-sm not-italic text-black/60">
                          <span aria-hidden>📍</span>
                          <span>{address}</span>
                        </address>
                      )}

                      {b.services && b.services.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-1.5" role="list" aria-label={isAr ? 'الخدمات' : 'Services'}>
                          {b.services.map((s) => (
                            <li key={s} className="rounded-full bg-[var(--color-brand-ivory,#F5F0E8)] px-2.5 py-0.5 text-xs text-[var(--color-brand-espresso,#3B1F0E)] ring-1 ring-[var(--color-brand-gold,#C9A87C)]/40">
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}

                      {b.openingHours && (
                        <details className="mt-4 rounded-lg bg-black/[0.02] px-3 py-2 ring-1 ring-black/5">
                          <summary className="cursor-pointer text-sm font-medium text-[var(--color-brand-espresso,#3B1F0E)]">
                            {isAr ? 'ساعات العمل' : 'Opening hours'}
                          </summary>
                          <div className="mt-2">
                            <WeeklyHours hours={b.openingHours} isAr={isAr} />
                            {note && <p className="mt-2 text-xs text-amber-800">{note}</p>}
                          </div>
                        </details>
                      )}

                      <div className="mt-auto flex flex-wrap gap-2 pt-5">
                        {b.googleMapsUrl && (
                          <a
                            href={b.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-[7rem] flex-1 rounded-full bg-[var(--color-brand-espresso,#3B1F0E)] px-4 py-2 text-center text-sm font-semibold text-white no-underline transition hover:bg-[var(--color-brand-bronze,#A0784A)]"
                          >
                            {isAr ? 'الاتجاهات' : 'Directions'}
                          </a>
                        )}
                        {b.phone && (
                          <a
                            href={`tel:${b.phone.replace(/\s+/g, '')}`}
                            className="min-w-[7rem] flex-1 rounded-full border border-[var(--color-brand-espresso,#3B1F0E)] px-4 py-2 text-center text-sm font-semibold text-[var(--color-brand-espresso,#3B1F0E)] no-underline transition hover:bg-[var(--color-brand-espresso,#3B1F0E)] hover:text-white"
                          >
                            <span dir="ltr">{isAr ? 'اتصل' : 'Call'}</span>
                          </a>
                        )}
                        {address && (
                          <button
                            type="button"
                            onClick={() => copyAddress(b)}
                            className="rounded-full border border-black/10 px-3 py-2 text-xs font-medium text-black/60 transition hover:border-[var(--color-brand-gold,#C9A87C)]"
                          >
                            {copied === b.slug ? (isAr ? 'تم النسخ ✓' : 'Copied ✓') : (isAr ? 'نسخ العنوان' : 'Copy address')}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      ) : (
        <div className="py-20 text-center" role="status">
          <p className="text-4xl mb-3" aria-hidden>☕</p>
          <p className="text-black/60">{isAr ? 'لا توجد فروع مطابقة' : 'No branches match your search'}</p>
        </div>
      )}
    </div>
  );
}
