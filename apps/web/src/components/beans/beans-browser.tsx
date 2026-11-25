'use client';

import { useMemo, useState } from 'react';
import { BEANS, ORIGINS, ROAST_LABELS, type Bean, type Lang, type OriginKey, type RoastLevel } from '@/lib/beans';
import { FlavourRadar, type RadarSeries } from './flavour-radar';
import { RoastBar } from './roast-bar';

const MAX_COMPARE = 3;
// Colour + dash so the three overlaid beans stay distinguishable without relying on colour alone.
const SERIES_STYLE = [
  { color: 'var(--color-brand-espresso)', dash: undefined },
  { color: 'var(--color-brand-bronze)', dash: '6 3' },
  { color: 'var(--color-brand-bronze-light)', dash: '2 3' },
] as const;

const T = {
  en: {
    search: 'Search beans', searchPh: 'Search by name, origin or flavour', roast: 'Roast level', origin: 'Origin',
    allRoasts: 'All roasts', allOrigins: 'All origins', clear: 'Clear filters', results: (n: number) => `${n} ${n === 1 ? 'bean' : 'beans'}`,
    none: 'No beans match your filters.', region: 'Region', altitude: 'Altitude', process: 'Process', notes: 'Tasting notes',
    roastBar: 'Roast', flavour: 'Flavour profile', brew: 'How to brew', method: 'Method', grind: 'Grind', water: 'Water',
    compare: 'Compare', compareFull: 'Max 3', comparing: (n: number) => `Comparing ${n} of ${MAX_COMPARE}`,
    compareHint: 'Select at least 2 beans to compare side by side.', clearCompare: 'Clear comparison',
    placeholder: '[PLACEHOLDER]', placeholderNote: 'origin & flavour details pending', metres: 'm', unknown: '—',
    comparisonTitle: 'Side-by-side comparison', overlay: 'Flavour overlay',
  },
  ar: {
    search: 'ابحث عن حبوب', searchPh: 'ابحث بالاسم أو المصدر أو النكهة', roast: 'درجة التحميص', origin: 'المصدر',
    allRoasts: 'كل درجات التحميص', allOrigins: 'كل المصادر', clear: 'مسح التصفية', results: (n: number) => `${n} ${n === 1 ? 'صنف' : 'أصناف'}`,
    none: 'لا توجد حبوب مطابقة للتصفية.', region: 'المنطقة', altitude: 'الارتفاع', process: 'المعالجة', notes: 'نكهات التذوق',
    roastBar: 'التحميص', flavour: 'ملف النكهة', brew: 'طريقة التحضير', method: 'الطريقة', grind: 'الطحن', water: 'الماء',
    compare: 'قارن', compareFull: 'الحد 3', comparing: (n: number) => `مقارنة ${n} من ${MAX_COMPARE}`,
    compareHint: 'اختر صنفين على الأقل للمقارنة جنبًا إلى جنب.', clearCompare: 'مسح المقارنة',
    placeholder: '[نص تجريبي — PLACEHOLDER]', placeholderNote: 'تفاصيل المصدر والنكهة قيد الاعتماد', metres: 'م', unknown: '—',
    comparisonTitle: 'مقارنة جنبًا إلى جنب', overlay: 'مقارنة النكهات',
  },
} as const;

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[ً-ٟ]/g, '');

function altitude(b: Bean, lang: Lang): string {
  if (!b.altitudeM) return T[lang].unknown;
  const f = (n: number) => n.toLocaleString(lang === 'ar' ? 'ar-AE' : 'en-US');
  return `${f(b.altitudeM.min)}–${f(b.altitudeM.max)} ${T[lang].metres}`;
}

function PlaceholderTag({ lang, bean }: { lang: Lang; bean: Bean }) {
  if (!bean.placeholder) return null;
  return (
    <span className="rounded bg-[var(--color-warning)]/15 px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-[var(--color-warning)]">
      {T[lang].placeholder}
    </span>
  );
}

export function BeansBrowser({ lang }: { lang: Lang }) {
  const t = T[lang];
  const [q, setQ] = useState('');
  const [roast, setRoast] = useState<'' | `${RoastLevel}`>('');
  const [origin, setOrigin] = useState<'' | OriginKey>('');
  const [picked, setPicked] = useState<string[]>([]);

  const shown = useMemo(() => {
    const needle = norm(q.trim());
    return BEANS.filter((b) => {
      if (roast && String(b.roast) !== roast) return false;
      if (origin && !b.originKeys.includes(origin)) return false;
      if (!needle) return true;
      const hay = [b.name, b.origin, b.region, b.process, b.description, ...b.notes].map((l) => `${l.en} ${l.ar}`).join(' ');
      return norm(hay).includes(needle);
    });
  }, [q, roast, origin]);

  const originOptions = useMemo(() => {
    const keys = new Set<OriginKey>(BEANS.flatMap((b) => b.originKeys));
    return (Object.keys(ORIGINS) as OriginKey[]).filter((k) => keys.has(k));
  }, []);

  const toggle = (id: string) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= MAX_COMPARE ? cur : [...cur, id]));
  const chosen = picked.map((id) => BEANS.find((b) => b.id === id)).filter((b): b is Bean => Boolean(b));
  const filtered = Boolean(q || roast || origin);

  const field =
    'w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]';

  return (
    <div>
      {/* Filters */}
      <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-4 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--color-text-secondary)]">{t.search}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchPh} className={field} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--color-text-secondary)]">{t.roast}</span>
          <select value={roast} onChange={(e) => setRoast(e.target.value as typeof roast)} className={field}>
            <option value="">{t.allRoasts}</option>
            {([1, 2, 3, 4, 5] as RoastLevel[]).map((l) => (
              <option key={l} value={String(l)}>{l} · {ROAST_LABELS[l][lang]}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--color-text-secondary)]">{t.origin}</span>
          <select value={origin} onChange={(e) => setOrigin(e.target.value as typeof origin)} className={field}>
            <option value="">{t.allOrigins}</option>
            {originOptions.map((k) => (
              <option key={k} value={k}>{ORIGINS[k][lang]}</option>
            ))}
          </select>
        </label>
      </form>
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)]" aria-live="polite">
        <span>{t.results(shown.length)}</span>
        {filtered && (
          <button type="button" onClick={() => { setQ(''); setRoast(''); setOrigin(''); }} className="underline hover:text-[var(--color-interactive-hover)]">
            {t.clear}
          </button>
        )}
      </div>

      {/* Comparison */}
      {chosen.length > 0 && (
        <section aria-label={t.comparisonTitle} className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[var(--color-brand-espresso)]">{t.comparisonTitle} <span className="text-sm font-normal text-[var(--color-text-muted)]">({t.comparing(chosen.length)})</span></h2>
            <button type="button" onClick={() => setPicked([])} className="text-sm underline hover:text-[var(--color-interactive-hover)]">{t.clearCompare}</button>
          </div>
          {chosen.length < 2 ? (
            <p className="text-sm text-[var(--color-text-muted)]">{t.compareHint}</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-[1fr_300px]">
              <div className="min-w-0 text-[0.8rem] sm:text-sm">
                <div className="grid gap-x-3 gap-y-3" style={{ gridTemplateColumns: `minmax(64px,0.7fr) repeat(${chosen.length}, minmax(0,1fr))` }}>
                  <span />
                  {chosen.map((b, i) => (
                    <strong key={b.id} className="break-words text-[var(--color-brand-espresso)]">
                      <span aria-hidden className="me-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: SERIES_STYLE[i]?.color }} />
                      {b.name[lang]}
                    </strong>
                  ))}
                  {([
                    [t.origin, (b: Bean) => b.origin[lang]],
                    [t.region, (b: Bean) => b.region[lang]],
                    [t.altitude, (b: Bean) => altitude(b, lang)],
                    [t.process, (b: Bean) => b.process[lang]],
                    [t.notes, (b: Bean) => b.notes.map((n) => n[lang]).join(lang === 'ar' ? '، ' : ', ')],
                    [t.grind, (b: Bean) => b.brew.grind[lang]],
                    [t.water, (b: Bean) => b.brew.water[lang]],
                  ] as [string, (b: Bean) => string][]).map(([label, get]) => (
                    <div key={label} className="contents">
                      <span className="text-[var(--color-text-muted)]">{label}</span>
                      {chosen.map((b) => <span key={b.id} className="break-words">{get(b)}</span>)}
                    </div>
                  ))}
                  <span className="text-[var(--color-text-muted)]">{t.roastBar}</span>
                  {chosen.map((b) => (
                    <span key={b.id} className="min-w-0">
                      <RoastBar level={b.roast} lang={lang} label="" />
                    </span>
                  ))}
                </div>
                {chosen.some((b) => b.placeholder) && (
                  <p className="mt-4 text-xs font-semibold text-[var(--color-warning)]">{t.placeholder} {t.placeholderNote}</p>
                )}
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-[var(--color-text-secondary)]">{t.overlay}</h3>
                <FlavourRadar
                  lang={lang}
                  title={t.overlay}
                  series={chosen.map<RadarSeries>((b, i) => ({
                    id: b.id,
                    label: b.name[lang],
                    profile: b.profile,
                    color: SERIES_STYLE[i]?.color ?? 'var(--color-brand-espresso)',
                    ...(SERIES_STYLE[i]?.dash ? { dash: SERIES_STYLE[i].dash } : {}),
                  }))}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Cards */}
      {shown.length === 0 ? (
        <p role="status" className="rounded-xl bg-[var(--color-bg-muted)] p-6 text-center text-[var(--color-text-secondary)]">{t.none}</p>
      ) : (
        <ul role="list" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((b) => {
            const selected = picked.includes(b.id);
            const full = !selected && picked.length >= MAX_COMPARE;
            return (
              <li
                key={b.id}
                className={`flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--color-bg-elevated)] p-5 shadow-sm ring-1 ${selected ? 'ring-2 ring-[var(--color-brand-bronze)]' : 'ring-black/5'} border-t-4 border-[var(--color-brand-bronze-light)]`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-extrabold text-[var(--color-brand-espresso)]">{b.name[lang]}</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">{b.origin[lang]}</p>
                  </div>
                  <PlaceholderTag lang={lang} bean={b} />
                </div>

                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div><dt className="text-[var(--color-text-muted)]">{t.region}</dt><dd className="font-semibold">{b.region[lang]}</dd></div>
                  <div><dt className="text-[var(--color-text-muted)]">{t.altitude}</dt><dd className="font-semibold">{altitude(b, lang)}</dd></div>
                  <div><dt className="text-[var(--color-text-muted)]">{t.process}</dt><dd className="font-semibold">{b.process[lang]}</dd></div>
                </dl>

                <RoastBar level={b.roast} lang={lang} label={t.roast} />

                <ul role="list" aria-label={t.notes} className="flex flex-wrap gap-1.5">
                  {b.notes.map((n) => (
                    <li key={n.en} className="rounded-full bg-[var(--color-bg-muted)] px-2.5 py-1 text-xs text-[var(--color-brand-espresso)]">{n[lang]}</li>
                  ))}
                </ul>

                <p className="text-sm text-[var(--color-text-secondary)]">{b.description[lang]}</p>

                <div className="mx-auto w-full max-w-[260px]">
                  <FlavourRadar
                    lang={lang}
                    title={`${t.flavour}: ${b.name[lang]}`}
                    series={[{ id: b.id, label: b.name[lang], profile: b.profile, color: 'var(--color-brand-bronze)' }]}
                  />
                </div>

                <details className="rounded-lg bg-[var(--color-bg-muted)] px-3 py-2 text-sm">
                  <summary className="cursor-pointer font-semibold text-[var(--color-brand-espresso)]">{t.brew}</summary>
                  <dl className="mt-2 space-y-1 text-[var(--color-text-secondary)]">
                    <div><dt className="inline font-semibold">{t.method}: </dt><dd className="inline">{b.brew.method[lang]}</dd></div>
                    <div><dt className="inline font-semibold">{t.grind}: </dt><dd className="inline">{b.brew.grind[lang]}</dd></div>
                    <div><dt className="inline font-semibold">{t.water}: </dt><dd className="inline">{b.brew.water[lang]}</dd></div>
                  </dl>
                  {b.placeholder && <p className="mt-2 text-xs font-semibold text-[var(--color-warning)]">{t.placeholder}</p>}
                </details>

                <label className={`mt-auto inline-flex items-center gap-2 text-sm ${full ? 'opacity-50' : 'cursor-pointer'}`}>
                  <input type="checkbox" checked={selected} disabled={full} onChange={() => toggle(b.id)} />
                  {t.compare}{full ? ` (${t.compareFull})` : ''}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
