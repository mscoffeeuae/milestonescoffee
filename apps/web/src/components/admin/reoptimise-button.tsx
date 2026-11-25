'use client';

import { useState } from 'react';

interface Labels { button: string; help: string; working: string; done: string; skipped: string; failed: string }

/** Walks the menu items that still need optimising, one request each, with a running count. */
export function ReoptimiseButton({ labels }: { labels: Labels }) {
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [failures, setFailures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setState('running'); setError(null); setCount(0); setFailures([]);
    try {
      const res = await fetch('/admin/menu/reoptimise', { cache: 'no-store' });
      const list = (await res.json()) as { ok: boolean; ids?: string[]; skipped?: number; code?: string };
      if (!list.ok || !list.ids) { setError(list.code ?? 'error'); setState('idle'); return; }
      setTotal(list.ids.length);
      setSkipped(list.skipped ?? 0);
      const failed: string[] = [];
      for (const id of list.ids) {
        try {
          const r = await fetch('/admin/menu/reoptimise', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          const j = (await r.json()) as { ok: boolean; message?: string };
          if (!j.ok) failed.push(`${id}: ${j.message ?? 'failed'}`);
        } catch {
          failed.push(`${id}: network error`);
        }
        setCount((n) => n + 1);
      }
      setFailures(failed);
      setState('done');
    } catch {
      setError('error');
      setState('idle');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <button
        type="button"
        onClick={run}
        disabled={state === 'running'}
        title={labels.help}
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] disabled:opacity-50"
      >
        {labels.button}
      </button>
      {state === 'running' && <span role="status" className="text-xs text-[var(--color-text-secondary)]">{labels.working}: {count} / {total}</span>}
      {state === 'done' && (
        <span role="status" className="text-xs text-[var(--color-text-secondary)]">
          {labels.done}: {count - failures.length} / {total} · {labels.skipped}: {skipped}
          {failures.length > 0 && <span className="text-[var(--color-error)]"> · {labels.failed}: {failures.length}</span>}
        </span>
      )}
      {error && <span role="alert" className="text-xs text-[var(--color-error)]">{error}</span>}
      {failures.length > 0 && (
        <ul className="w-full text-xs text-[var(--color-error)]">{failures.map((f) => <li key={f}>{f}</li>)}</ul>
      )}
    </div>
  );
}
