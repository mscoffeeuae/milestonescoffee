import { ROAST_LABELS, type Lang, type RoastLevel } from '@/lib/beans';

/** Five-step roast scale; filled steps use the espresso colour. */
export function RoastBar({ level, lang, label }: { level: RoastLevel; lang: Lang; label: string }) {
  const name = ROAST_LABELS[level][lang];
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
        <span>{label}</span>
        <span className="font-semibold text-[var(--color-brand-espresso)]">{level}/5 · {name}</span>
      </div>
      <div role="img" aria-label={`${label}: ${level}/5, ${name}`} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className="h-2 flex-1 rounded-full"
            style={{ background: n <= level ? 'var(--color-brand-espresso)' : 'var(--color-bg-muted)' }}
          />
        ))}
      </div>
    </div>
  );
}
