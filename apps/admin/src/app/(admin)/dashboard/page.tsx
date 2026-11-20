export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const base = 'https://txh3gqgo.api.sanity.io/v2021-10-21/data/query/production';
    const q = (query: string) =>
      fetch(`${base}?query=${encodeURIComponent(query)}`, { cache: 'no-store' })
        .then(r => r.json()).then(d => d.result ?? 0);
    const [posts, gallery] = await Promise.all([
      q('count(*[_type == "post"])'),
      q('count(*[_type == "galleryImage"])'),
    ]);
    return { posts, gallery };
  } catch { return { posts: 0, gallery: 0 }; }
}

const activity = [
  { time: 'Just now', event: 'Admin panel initialized', type: 'info' },
  { time: '5m ago',   event: 'Gallery schema awaiting Sanity setup', type: 'warning' },
  { time: '10m ago',  event: 'Blog CMS ready — 0 posts', type: 'info' },
  { time: 'Today',    event: 'About, Blog, Franchise pages live', type: 'success' },
  { time: 'Today',    event: 'Gallery @milestones/cms fix deployed', type: 'success' },
];

export default async function DashboardPage() {
  const { posts, gallery } = await getStats();
  const topCards = [
    { label: 'Total Orders',    value: '—',   sub: 'API pending',    color: '#A0784A', icon: '🛒' },
    { label: 'Revenue (AED)',   value: '—',   sub: 'API pending',    color: '#2D7A4A', icon: '💰' },
    { label: 'Active Branches', value: '30+', sub: 'UAE network',    color: '#1A5F8A', icon: '📍' },
    { label: 'Menu Items',      value: '—',   sub: 'Sanity pending', color: '#B86A00', icon: '☕' },
    { label: 'Blog Posts',      value: String(posts),   sub: 'From Sanity', color: '#A0784A', icon: '✍️' },
    { label: 'Gallery Images',  value: String(gallery), sub: 'From Sanity', color: '#1A5F8A', icon: '🖼' },
  ];
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Welcome back — Milestones Coffee HQ</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 32 }}>
        {topCards.map(({ label, value, sub, color, icon }) => (
          <div key={label} style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 20, borderLeft: `4px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color, marginTop: 4 }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{sub}</div>
              </div>
              <span style={{ fontSize: '1.4rem' }}>{icon}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Recent Activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activity.map(({ time, event, type }, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '0.875rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: type === 'success' ? '#2D7A4A' : type === 'warning' ? '#B86A00' : '#1A5F8A' }} />
                <div>
                  <div style={{ color: 'var(--color-text-primary)' }}>{event}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { href: '/menu',     label: '➕  Add Menu Item' },
              { href: '/gallery',  label: '🖼  Upload to Gallery' },
              { href: '/blog',     label: '✍️  Write Blog Post' },
              { href: '/locations',label: '📍  Manage Locations' },
              { href: 'https://txh3gqgo.sanity.studio', label: '🔗  Open Sanity Studio', ext: true },
            ].map(({ href, label, ext }) => (
              <a key={href} href={href} target={ext ? '_blank' : undefined} rel={ext ? 'noopener noreferrer' : undefined}
                style={{ display: 'block', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-muted)', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
