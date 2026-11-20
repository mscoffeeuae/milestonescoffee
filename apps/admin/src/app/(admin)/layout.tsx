'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const nav = [
  { href: '/dashboard',  icon: '📊', label: 'Dashboard' },
  { href: '/orders',     icon: '🛒', label: 'Orders' },
  { href: '/menu',       icon: '☕', label: 'Menu Items' },
  { href: '/locations',  icon: '📍', label: 'Locations' },
  { href: '/gallery',    icon: '🖼',  label: 'Gallery' },
  { href: '/blog',       icon: '✍️',  label: 'Blog' },
  { href: '/users',      icon: '👥', label: 'Users' },
  { href: '/settings',   icon: '⚙️',  label: 'Settings' },
];

function Sidebar() {
  const path = usePathname();
  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: 'var(--color-sidebar-bg)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
    }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ color: 'var(--color-brand-gold)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
          ☕ Milestones
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: 2 }}>Admin Panel</div>
      </div>
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(({ href, icon, label }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 'var(--radius-md)',
              color: active ? '#fff' : 'rgba(255,255,255,0.6)',
              background: active ? 'var(--color-brand-bronze)' : 'transparent',
              textDecoration: 'none', fontSize: '0.9rem', fontWeight: active ? 600 : 400,
              transition: 'all 0.15s',
            }}>
              <span>{icon}</span><span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
        v2.0 · milestonescoffee.ae
      </div>
    </aside>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{
          height: 56, background: 'var(--color-bg-elevated)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            🕐 {new Date().toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-brand-bronze)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
              AD
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Admin</span>
          </div>
        </header>
        <main style={{ flex: 1, padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
