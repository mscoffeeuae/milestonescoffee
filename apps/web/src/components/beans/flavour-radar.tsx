import { FLAVOUR_AXES, FLAVOUR_LABELS, type FlavourProfile, type Lang } from '@/lib/beans';

export interface RadarSeries {
  id: string;
  label: string;
  profile: FlavourProfile;
  /** Brand colour token, e.g. var(--color-brand-espresso). */
  color: string;
  /** SVG stroke-dasharray so series stay distinguishable without colour. */
  dash?: string;
}

const W = 280;
const H = 250;
const CX = W / 2;
const CY = 124;
const R = 74; // outer ring (score 5)
const LABEL_R = 94;
const MAX = 5;

const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / FLAVOUR_AXES.length;
const pt = (i: number, r: number): [number, number] => [CX + r * Math.cos(angle(i)), CY + r * Math.sin(angle(i))];
const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** Flavour wheel as a radar chart: inline SVG, brand colour tokens, no chart library. */
export function FlavourRadar({ series, lang, title }: { series: RadarSeries[]; lang: Lang; title: string }) {
  const summary = series
    .map((s) => `${s.label}: ${FLAVOUR_AXES.map((a) => `${FLAVOUR_LABELS[a][lang]} ${s.profile[a]}`).join(', ')}`)
    .join('. ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. ${summary}`} className="block h-auto w-full max-w-[320px]">
      {/* grid rings */}
      {[1, 2, 3, 4, 5].map((lvl) => (
        <polygon
          key={lvl}
          points={poly(FLAVOUR_AXES.map((_, i) => pt(i, (R * lvl) / MAX)))}
          fill="none"
          style={{ stroke: 'var(--color-border)' }}
          strokeWidth={lvl === MAX ? 1.25 : 0.75}
        />
      ))}
      {/* spokes + labels */}
      {FLAVOUR_AXES.map((axis, i) => {
        const [x2, y2] = pt(i, R);
        const [lx, ly] = pt(i, LABEL_R);
        return (
          <g key={axis}>
            <line x1={CX} y1={CY} x2={x2} y2={y2} style={{ stroke: 'var(--color-border)' }} strokeWidth={0.75} />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              style={{ fill: 'var(--color-text-secondary)' }}
            >
              {FLAVOUR_LABELS[axis][lang]}
            </text>
          </g>
        );
      })}
      {/* data */}
      {series.map((s) => {
        const pts = FLAVOUR_AXES.map((a, i) => pt(i, (R * Math.max(0, Math.min(MAX, s.profile[a]))) / MAX));
        return (
          <g key={s.id}>
            <polygon
              points={poly(pts)}
              style={{ fill: s.color, stroke: s.color }}
              fillOpacity={series.length > 1 ? 0.1 : 0.22}
              strokeWidth={2}
              strokeLinejoin="round"
              {...(s.dash ? { strokeDasharray: s.dash } : {})}
            />
            {pts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={2.5} style={{ fill: s.color }} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
