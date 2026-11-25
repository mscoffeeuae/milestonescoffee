'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Entry { type: 'menu' | 'branch' | 'offer' | 'page'; en: string; ar: string; sub?: string; href: string }

export interface QuickSearchLabels {
  button: string; placeholder: string; none: string; hint: string; loading: string;
  types: Record<Entry['type'], string>;
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[ً-ٟ]/g, '');
const MAX_RESULTS = 12;

/** Ctrl/Cmd+K palette over menu items, branches, offers and admin pages. Uses a native <dialog> for focus handling. */
export function QuickSearch({ lang, labels }: { lang: 'en' | 'ar'; labels: QuickSearchLabels }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<Entry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);

  const show = useCallback(() => {
    setOpen(true);
    setQ('');
    setActive(0);
    dialog.current?.showModal();
    requestAnimationFrame(() => input.current?.focus());
  }, []);
  const hide = useCallback(() => {
    dialog.current?.close();
    setOpen(false);
  }, []);

  // Global shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (dialog.current?.open) hide(); else show();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, hide]);

  // Load the index the first time the palette opens
  useEffect(() => {
    if (!open || index || failed) return;
    fetch('/admin/search', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<Entry[]>) : Promise.reject(new Error(String(r.status)))))
      .then(setIndex)
      .catch(() => setFailed(true));
  }, [open, index, failed]);

  const results = useMemo(() => {
    if (!index) return [];
    const needle = norm(q.trim());
    const hay = (e: Entry) => norm(`${e.en} ${e.ar} ${e.sub ?? ''}`);
    const list = needle ? index.filter((e) => hay(e).includes(needle)) : index.filter((e) => e.type === 'page');
    // Name matches that start with the query come first.
    const starts = (e: Entry) => (norm(e.en).startsWith(needle) || norm(e.ar).startsWith(needle) ? 0 : 1);
    return [...list].sort((a, b) => (needle ? starts(a) - starts(b) : 0)).slice(0, MAX_RESULTS);
  }, [index, q]);

  useEffect(() => { setActive(0); }, [q]);

  const go = (e: Entry) => {
    hide();
    router.push(e.href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const r = results[active]; if (r) go(r); }
  };

  useEffect(() => {
    document.getElementById(`qs-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
      >
        <span>{labels.button}</span>
        <kbd className="hidden rounded border border-[var(--color-border)] px-1.5 text-xs sm:inline">Ctrl K</kbd>
      </button>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === dialog.current) hide(); }}
        aria-label={labels.button}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className="m-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-0 text-[var(--color-text-primary)] shadow-[var(--shadow-md)] backdrop:bg-black/40"
      >
        <div className="p-3">
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls="qs-list"
            aria-activedescendant={results[active] ? `qs-opt-${active}` : undefined}
            aria-autocomplete="list"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder={labels.placeholder}
            aria-label={labels.placeholder}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-base)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          />
        </div>
        <ul id="qs-list" role="listbox" className="max-h-[50vh] overflow-y-auto border-t border-[var(--color-border)] p-1">
          {!index && !failed && <li className="px-3 py-2 text-sm text-[var(--color-text-muted)]">{labels.loading}</li>}
          {(index || failed) && results.length === 0 && <li className="px-3 py-2 text-sm text-[var(--color-text-muted)]">{labels.none}</li>}
          {results.map((r, i) => (
            <li
              key={`${r.type}:${r.href}:${r.en}`}
              id={`qs-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm ${i === active ? 'bg-[var(--color-bg-muted)]' : ''}`}
            >
              <span className="min-w-0 truncate">
                {lang === 'ar' ? r.ar : r.en}
                {r.sub && <span className="ms-2 text-xs text-[var(--color-text-muted)]">{r.sub}</span>}
              </span>
              <span className="shrink-0 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">{labels.types[r.type]}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-muted)]">{labels.hint}</p>
      </dialog>
    </>
  );
}
