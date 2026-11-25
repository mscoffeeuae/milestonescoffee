'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CmsImage, type CmsImageSource } from '@/components/media/cms-image';

export interface MenuProduct {
  _id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  displayPriceAed: number | null;
  allergens: string[] | null;
  dietaryFlags: string[] | null;
  isNew: boolean;
  isFeatured: boolean;
  productImage: CmsImageSource | null;
  productImageThumb?: CmsImageSource | null;
}

export interface MenuCategory {
  _id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  products: MenuProduct[];
}

// Labels mirror apps/studio/src/schemas/documents/menu-product.ts option lists
const ALLERGEN_LABELS: Record<string, [string, string]> = {
  dairy: ['Dairy', 'ألبان'],
  gluten: ['Gluten', 'غلوتين'],
  eggs: ['Eggs', 'بيض'],
  'tree-nuts': ['Tree nuts', 'مكسرات'],
  peanuts: ['Peanuts', 'فول سوداني'],
  soy: ['Soy', 'صويا'],
  sesame: ['Sesame', 'سمسم'],
  fish: ['Fish', 'سمك'],
  shellfish: ['Shellfish', 'محار'],
  sulphites: ['Sulphites', 'كبريتيت'],
};

const DIET_LABELS: Record<string, [string, string, string]> = {
  vegan: ['Vegan', 'نباتي صرف', '🌱'],
  vegetarian: ['Vegetarian', 'نباتي', '🥬'],
  halal: ['Halal', 'حلال', '✓'],
  'gluten-free': ['Gluten-free', 'خالٍ من الغلوتين', '🌾'],
  'sugar-free': ['Sugar-free', 'خالٍ من السكر', '⊘'],
  'dairy-free': ['Dairy-free', 'خالٍ من الألبان', '🥛'],
};

const FAV_KEY = 'ms-menu-favourites';

const label = (map: Record<string, string[]>, key: string, isAr: boolean) =>
  map[key] ? map[key][isAr ? 1 : 0] : key;

export function MenuBrowser({ categories, locale }: { categories: MenuCategory[]; locale: 'en' | 'ar' }) {
  const isAr = locale === 'ar';
  const [query, setQuery] = useState('');
  const [diets, setDiets] = useState<string[]>([]);
  const [avoid, setAvoid] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<'default' | 'asc' | 'desc'>('default');
  const [favs, setFavs] = useState<string[]>([]);
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  // Favourites live in localStorage only; every access is guarded (private mode / blocked storage).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setFavs(parsed.filter((x): x is string => typeof x === 'string'));
    } catch {
      /* storage unavailable or corrupt: start empty */
    }
  }, []);
  const toggleFav = useCallback((id: string) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  // Only offer filters that exist in the data
  const { availDiets, availAllergens, total } = useMemo(() => {
    const d = new Set<string>();
    const a = new Set<string>();
    let t = 0;
    for (const c of categories)
      for (const p of c.products) {
        t++;
        p.dietaryFlags?.forEach((x) => d.add(x));
        p.allergens?.forEach((x) => a.add(x));
      }
    return { availDiets: [...d], availAllergens: [...a], total: t };
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((c) => ({
        ...c,
        products: c.products.filter((p) => {
          if (q) {
            const hay = `${p.nameEn} ${p.nameAr} ${p.descriptionEn ?? ''} ${p.descriptionAr ?? ''}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          if (onlyFavs && !favs.includes(p._id)) return false;
          if (diets.length && !diets.every((d) => p.dietaryFlags?.includes(d))) return false;
          if (avoid.length && avoid.some((a) => p.allergens?.includes(a))) return false;
          return true;
        }),
      }))
      .filter((c) => c.products.length > 0)
      .map((c) =>
        sort === 'default'
          ? c
          : {
              ...c,
              products: [...c.products].sort((a, b) =>
                sort === 'asc' ? (a.displayPriceAed ?? 0) - (b.displayPriceAed ?? 0) : (b.displayPriceAed ?? 0) - (a.displayPriceAed ?? 0),
              ),
            },
      );
  }, [categories, query, diets, avoid, sort, onlyFavs, favs]);

  // Scroll-spy: highlight the tab for the section nearest the top of the viewport.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const ids = filtered.map((c) => c.slug);
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first) setActiveCat(first);
      },
      { rootMargin: '-160px 0px -55% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [filtered]);

  // Keep the active tab visible inside the horizontally scrolling bar (never scrolls the page).
  useEffect(() => {
    if (!activeCat) return;
    const tab = document.querySelector<HTMLElement>(`[data-cat-tab="${activeCat}"]`);
    const nav = tab?.closest('nav');
    if (tab && nav) nav.scrollTo({ left: tab.offsetLeft - nav.clientWidth / 2 + tab.clientWidth / 2, behavior: 'smooth' });
  }, [activeCat]);

  const featured = useMemo(
    () => filtered.flatMap((c) => c.products.filter((p) => p.isFeatured)).slice(0, 4),
    [filtered],
  );
  const shown = filtered.reduce((n, c) => n + c.products.length, 0);
  const activeCount = diets.length + avoid.length + (query ? 1 : 0) + (onlyFavs ? 1 : 0);

  return (
    <>
      {/* Sticky toolbar: search + category pills */}
      <div className="sticky top-0 z-20 bg-[var(--color-brand-ivory,#F5F0E8)]/95 backdrop-blur border-b border-black/5 shadow-sm">
        <div className="container mx-auto px-4 py-3 space-y-3">
          <div className="flex gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">{isAr ? 'ابحث في القائمة' : 'Search the menu'}</span>
              <span aria-hidden className="absolute inset-y-0 start-3 flex items-center text-[var(--color-brand-bronze,#A0784A)]">⌕</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isAr ? 'ابحث عن مشروب أو طبق…' : 'Search drinks & dishes…'}
                className="w-full rounded-full border border-black/10 bg-white ps-9 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-gold,#C9A87C)]"
              />
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'default' | 'asc' | 'desc')}
              aria-label={isAr ? 'ترتيب' : 'Sort'}
              className="min-w-0 max-w-[9rem] shrink-0 rounded-full border border-black/10 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-gold,#C9A87C)]"
            >
              <option value="default">{isAr ? 'الترتيب الافتراضي' : 'Default order'}</option>
              <option value="asc">{isAr ? 'السعر: من الأقل' : 'Price: low to high'}</option>
              <option value="desc">{isAr ? 'السعر: من الأعلى' : 'Price: high to low'}</option>
            </select>
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              aria-expanded={showFilters}
              className="shrink-0 rounded-full border border-black/10 bg-white px-4 text-sm font-medium hover:border-[var(--color-brand-gold,#C9A87C)]"
            >
              {isAr ? 'تصفية' : 'Filters'}
              {activeCount > 0 && (
                <span className="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-espresso,#3B1F0E)] px-1.5 text-xs text-white">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (availDiets.length > 0 || availAllergens.length > 0 || favs.length > 0) && (
            <div className="space-y-2 pb-1">
              {favs.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={onlyFavs}
                    onClick={() => setOnlyFavs((v) => !v)}
                    className={`rounded-full px-3 py-1 text-xs border transition ${
                      onlyFavs
                        ? 'bg-[var(--color-brand-espresso,#3B1F0E)] text-white border-[var(--color-brand-espresso,#3B1F0E)]'
                        : 'bg-white border-black/10 hover:border-[var(--color-brand-bronze,#A0784A)]'
                    }`}
                  >
                    ♥ {isAr ? 'المفضلة' : 'Favourites'} ({favs.length})
                  </button>
                </div>
              )}
              {availDiets.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-black/50">{isAr ? 'النظام الغذائي' : 'Dietary'}</span>
                  {availDiets.map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={diets.includes(d)}
                      onClick={() => toggle(diets, setDiets, d)}
                      className={`rounded-full px-3 py-1 text-xs border transition ${
                        diets.includes(d)
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white border-black/10 hover:border-emerald-600'
                      }`}
                    >
                      {DIET_LABELS[d]?.[2]} {label(DIET_LABELS, d, isAr)}
                    </button>
                  ))}
                </div>
              )}
              {availAllergens.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-black/50">{isAr ? 'استبعاد' : 'Exclude'}</span>
                  {availAllergens.map((a) => (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={avoid.includes(a)}
                      onClick={() => toggle(avoid, setAvoid, a)}
                      className={`rounded-full px-3 py-1 text-xs border transition ${
                        avoid.includes(a)
                          ? 'bg-red-700 text-white border-red-700 line-through'
                          : 'bg-white border-black/10 hover:border-red-600'
                      }`}
                    >
                      {label(ALLERGEN_LABELS, a, isAr)}
                    </button>
                  ))}
                </div>
              )}
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setDiets([]); setAvoid([]); setOnlyFavs(false); }}
                  className="text-xs underline text-[var(--color-brand-bronze,#A0784A)]"
                >
                  {isAr ? 'مسح الكل' : 'Clear all'}
                </button>
              )}
            </div>
          )}

          <nav aria-label={isAr ? 'تصفح القائمة' : 'Browse menu'} className="-mx-4 overflow-x-auto px-4">
            <ul className="flex gap-2 whitespace-nowrap" role="list">
              {filtered.map((cat) => (
                <li key={cat._id}>
                  <a
                    href={`#${cat.slug}`}
                    data-cat-tab={cat.slug}
                    aria-current={activeCat === cat.slug ? 'true' : undefined}
                    className={`no-underline inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--color-brand-espresso,#3B1F0E)] hover:text-white ${
                      activeCat === cat.slug ? 'bg-[var(--color-brand-espresso,#3B1F0E)] text-white' : 'bg-white text-[var(--color-brand-espresso,#3B1F0E)]'
                    }`}
                  >
                    {isAr ? cat.nameAr : cat.nameEn}
                    <span className="text-xs opacity-60">{cat.products.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-16">
        <p className="text-sm text-black/50" aria-live="polite">
          {isAr ? `عرض ${shown} من ${total} صنف` : `Showing ${shown} of ${total} items`}
        </p>

        {/* Featured strip */}
        {featured.length > 0 && activeCount === 0 && (
          <section aria-labelledby="featured-h">
            <h2 id="featured-h" className="mb-5 flex items-center gap-2 text-2xl font-bold text-[var(--color-brand-espresso,#3B1F0E)]">
              <span aria-hidden className="text-[var(--color-brand-gold,#C9A87C)]">★</span>
              {isAr ? 'مختارات مميزة' : 'Featured picks'}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" role="list">
              {featured.map((p) => (
                <ProductCard key={`f-${p._id}`} product={p} isAr={isAr} compact fav={favs.includes(p._id)} onFav={toggleFav} />
              ))}
            </ul>
          </section>
        )}

        {filtered.length > 0 ? (
          filtered.map((category) => (
            <section key={category._id} id={category.slug} className="scroll-mt-40" aria-labelledby={`cat-${category._id}`}>
              <div className="mb-6 flex items-end justify-between gap-4 border-b border-[var(--color-brand-gold,#C9A87C)]/40 pb-3">
                <div>
                  <h2 id={`cat-${category._id}`} className="text-2xl md:text-3xl font-bold text-[var(--color-brand-espresso,#3B1F0E)]">
                    {isAr ? category.nameAr : category.nameEn}
                  </h2>
                  {(isAr ? category.descriptionAr : category.descriptionEn) && (
                    <p className="mt-1 text-black/60">{isAr ? category.descriptionAr : category.descriptionEn}</p>
                  )}
                </div>
                <span className="shrink-0 text-sm text-black/40">
                  {category.products.length} {isAr ? 'صنف' : category.products.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
                {category.products.map((p) => (
                  <ProductCard key={p._id} product={p} isAr={isAr} fav={favs.includes(p._id)} onFav={toggleFav} />
                ))}
              </ul>
            </section>
          ))
        ) : (
          <div className="py-20 text-center" role="status">
            <p className="text-4xl mb-3" aria-hidden>☕</p>
            <p className="text-black/60">{isAr ? 'لا توجد أصناف مطابقة' : 'No items match your filters'}</p>
          </div>
        )}
      </div>
    </>
  );
}

function ProductCard({ product: p, isAr, compact, fav, onFav }: { product: MenuProduct; isAr: boolean; compact?: boolean; fav: boolean; onFav: (id: string) => void }) {
  const name = isAr ? p.nameAr : p.nameEn;
  const desc = isAr ? p.descriptionAr : p.descriptionEn;
  return (
    <li
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-lg ${
        p.isFeatured ? 'ring-2 ring-[var(--color-brand-gold,#C9A87C)]' : 'ring-black/5'
      }`}
    >
      <div className={`relative overflow-hidden ${compact ? 'h-44' : 'h-56 sm:h-60'} bg-gradient-to-br from-[var(--color-brand-espresso,#3B1F0E)] to-[var(--color-brand-bronze,#A0784A)]`}>
        {p.productImage?.asset?.url ? (
          <CmsImage
            image={p.productImage}
            alt={name}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span aria-hidden className="absolute inset-0 flex items-center justify-center text-5xl font-serif text-[var(--color-brand-gold,#C9A87C)]/70">
            {name.charAt(0)}
          </span>
        )}
        <div className="absolute top-3 start-3 flex gap-1.5">
          {p.isFeatured && (
            <span className="rounded-full bg-[var(--color-brand-gold,#C9A87C)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-brand-espresso,#3B1F0E)] shadow">
              ★ {isAr ? 'مميز' : 'Featured'}
            </span>
          )}
          {p.isNew && (
            <span className="rounded-full bg-[var(--color-brand-espresso,#3B1F0E)] px-2.5 py-0.5 text-xs font-semibold text-white shadow">
              {isAr ? 'جديد' : 'New'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onFav(p._id)}
          aria-pressed={fav}
          aria-label={`${isAr ? 'إضافة إلى المفضلة: ' : 'Favourite: '}${name}`}
          className="absolute top-3 end-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg shadow focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          style={{ color: fav ? 'var(--color-error)' : 'var(--color-text-muted)' }}
        >
          <span aria-hidden>{fav ? '♥' : '♡'}</span>
        </button>
        {p.displayPriceAed != null && (
          <span className="absolute bottom-3 end-3 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-[var(--color-brand-espresso,#3B1F0E)] shadow">
            {isAr ? `${p.displayPriceAed} د.إ` : `AED ${p.displayPriceAed}`}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-lg text-[var(--color-brand-espresso,#3B1F0E)]">{name}</h3>
        {!isAr && p.nameAr && <p className="text-sm text-black/40" dir="rtl" lang="ar">{p.nameAr}</p>}
        {desc && !compact && <p className="mt-2 text-sm text-black/60 line-clamp-2">{desc}</p>}

        {p.dietaryFlags && p.dietaryFlags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" role="list" aria-label={isAr ? 'النظام الغذائي' : 'Dietary'}>
            {p.dietaryFlags.map((f) => (
              <li key={f} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 ring-1 ring-emerald-200">
                {DIET_LABELS[f]?.[2]} {label(DIET_LABELS, f, isAr)}
              </li>
            ))}
          </ul>
        )}

        {p.allergens && p.allergens.length > 0 && !compact && (
          <div className="mt-auto pt-3">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">{isAr ? 'يحتوي على: ' : 'Contains: '}</span>
              {p.allergens.map((a) => label(ALLERGEN_LABELS, a, isAr)).join(isAr ? '، ' : ', ')}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}
