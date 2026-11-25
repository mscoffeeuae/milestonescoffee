/** Skeleton shown while the (dynamic) menu page fetches CMS data. */
export default function MenuLoading() {
  return (
    <main id="main-content" aria-busy="true" className="min-h-screen" style={{ background: 'var(--color-bg-base)' }}>
      <div role="status" className="sr-only">
        Loading menu…
      </div>
      <div style={{ background: 'var(--color-brand-espresso)', height: 160 }} />
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse" style={{ height: 44, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-muted)', marginBottom: 'var(--spacing-xl)' }} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ height: 300, borderRadius: 'var(--radius-xl)', background: 'var(--color-bg-muted)' }} />
          ))}
        </div>
      </div>
    </main>
  );
}
