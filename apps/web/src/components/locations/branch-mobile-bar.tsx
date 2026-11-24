interface BranchMobileBarProps {
  isAr: boolean;
  directionsUrl: string | null;
  phone: string | null;
}

/** Sticky bottom bar for phones: Directions + Call. Hidden from md up. */
export function BranchMobileBar({ isAr, directionsUrl, phone }: BranchMobileBarProps) {
  if (!directionsUrl && !phone) return null;
  const base =
    'flex min-h-[48px] flex-1 items-center justify-center rounded-full px-4 text-sm font-semibold no-underline';
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 print:hidden border-t border-black/10 bg-white/95 p-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg gap-3">
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${base} bg-[var(--color-brand-espresso,#3B1F0E)] text-white`}
          >
            {isAr ? 'الاتجاهات' : 'Directions'}
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className={`${base} border border-[var(--color-brand-espresso,#3B1F0E)] text-[var(--color-brand-espresso,#3B1F0E)]`}
          >
            {isAr ? 'اتصل' : 'Call'}
          </a>
        )}
      </div>
    </div>
  );
}
