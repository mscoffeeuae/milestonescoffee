const MODES = [
  { mode: 'walking', en: 'Walking', ar: 'مشياً' },
  { mode: 'driving', en: 'Driving', ar: 'بالسيارة' },
  { mode: 'transit', en: 'Transit', ar: 'مواصلات' },
] as const;

interface BranchDirectionsProps {
  isAr: boolean;
  coords: { lat: number; lng: number } | null;
  address: string | null;
}

/** Google Maps directions links per travel mode (destination only; Maps asks for the start point). */
export function BranchDirections({ isAr, coords, address }: BranchDirectionsProps) {
  const destination = coords ? `${coords.lat},${coords.lng}` : address;
  if (!destination) return null;
  return (
    <div className="mt-4 print:hidden">
      <h3 className="mb-2 text-sm font-semibold text-[var(--color-brand-espresso,#3B1F0E)]">
        {isAr ? 'الاتجاهات حسب وسيلة التنقل' : 'Directions by mode'}
      </h3>
      <ul role="list" className="grid grid-cols-3 gap-2">
        {MODES.map((m) => (
          <li key={m.mode}>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=${m.mode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-btn ms-btn-secondary ms-btn-sm w-full"
            >
              {isAr ? m.ar : m.en}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
