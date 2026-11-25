/** Dependency-free SVG line chart styled with the app's CSS variables. */
export function LineChart({ points, label }: { points: { date: string; views: number }[]; label: string }) {
  const W = 600;
  const H = 180;
  const P = 8;
  if (points.length < 2) return null;
  const max = Math.max(...points.map((p) => p.views), 1);
  const x = (i: number) => P + (i / (points.length - 1)) * (W - P * 2);
  const y = (v: number) => H - P - (v / max) * (H - P * 2);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.views).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;
  const fmt = (d: string) => (d.length === 8 ? `${d.slice(6)}/${d.slice(4, 6)}` : d);
  return (
    // Charts are always LTR (time flows left→right) even inside an RTL page.
    <figure dir="ltr" className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={P} x2={W - P} y1={y(max * f)} y2={y(max * f)} stroke="var(--color-border)" strokeWidth="1" />
        ))}
        <path d={area} fill="var(--color-interactive)" opacity="0.12" />
        <path d={line} fill="none" stroke="var(--color-interactive)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>{fmt(points[0]?.date ?? '')}</span>
        <span>max {max.toLocaleString('en')}</span>
        <span>{fmt(points[points.length - 1]?.date ?? '')}</span>
      </figcaption>
    </figure>
  );
}
