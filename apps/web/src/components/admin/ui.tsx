import type { ReactNode } from 'react';
import type { OpenState } from '@/lib/admin/data';
import type { T } from '@/lib/admin/i18n';

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-[var(--spacing-lg)] shadow-[var(--shadow-sm)] ${className}`}
    >
      {title && <h2 className="mb-[var(--spacing-md)] text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'warn' | 'ok' | undefined }) {
  const color = tone === 'warn' ? 'var(--color-warning)' : tone === 'ok' ? 'var(--color-success)' : 'var(--color-text-primary)';
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-[var(--spacing-md)] shadow-[var(--shadow-sm)]">
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

export function StatusBadge({ state, t }: { state: OpenState; t: T }) {
  const color = state === 'open' ? 'var(--color-success)' : state === 'closed' ? 'var(--color-error)' : 'var(--color-warning)';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-2 py-0.5 text-xs font-medium"
      style={{ color, border: `1px solid ${color}` }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: color }} />
      {t(state)}
    </span>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export const th = 'px-2 py-2 text-start text-xs font-medium text-[var(--color-text-muted)] border-b border-[var(--color-border)]';
export const td = 'px-2 py-2 text-start border-b border-[var(--color-border)] text-[var(--color-text-primary)]';

export function ConnectGa({ t, error }: { t: T; error?: boolean }) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{error ? t('analytics') : t('connectGa')}</h2>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{error ? t('gaError') : t('connectGaBody')}</p>
    </Card>
  );
}

export function BarList({ rows, t, labelKey }: { rows: { label: string; value: number }[]; t: T; labelKey?: 'page' | 'source' | 'country' }) {
  if (rows.length === 0) return <p className="text-sm text-[var(--color-text-muted)]">{t('noData')}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2" aria-label={labelKey ? t(labelKey) : undefined}>
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="min-w-0 truncate text-[var(--color-text-primary)]" dir="ltr">{r.label}</span>
            <span className="tabular-nums text-[var(--color-text-secondary)]">{r.value.toLocaleString('en')}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[var(--color-bg-muted)]">
            <div className="h-1.5 rounded-full bg-[var(--color-interactive)]" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
