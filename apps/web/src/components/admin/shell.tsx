import Link from 'next/link';
import { logoutAction, setLangAction } from '@/app/admin/actions';
import type { AdminLang, T } from '@/lib/admin/i18n';
import { QuickSearch } from './quick-search';

const NAV = [
  { href: '/admin', key: 'dashboard' },
  { href: '/admin/branches', key: 'branches' },
  { href: '/admin/menu', key: 'menu' },
  { href: '/admin/offers', key: 'offers' },
  { href: '/admin/activity', key: 'activity' },
  { href: '/admin/analytics', key: 'analytics' },
  { href: '/admin/settings', key: 'settings' },
] as const;

const btn =
  'rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]';

export function AdminShell({ children, lang, t, authed }: { children: React.ReactNode; lang: AdminLang; t: T; authed: boolean }) {
  return (
    <div
      lang={lang}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Milestones · {t('title')}</span>
          {authed && (
            <nav aria-label="Admin" className="flex flex-wrap gap-1 text-sm">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-[var(--radius-md)] px-3 py-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]">
                  {t(n.key)}
                </Link>
              ))}
            </nav>
          )}
          <div className="ms-auto flex items-center gap-2">
            {authed && (
              <QuickSearch
                lang={lang}
                labels={{
                  button: t('quickSearch'), placeholder: t('searchPlaceholder'), none: t('searchNone'), hint: t('searchHint'), loading: t('searchLoading'),
                  types: { menu: t('st_menu'), branch: t('st_branch'), offer: t('st_offer'), page: t('st_page') },
                }}
              />
            )}
            <form action={setLangAction}>
              <input type="hidden" name="to" value={lang === 'ar' ? 'en' : 'ar'} />
              <button type="submit" className={btn}>{t('language')}</button>
            </form>
            {authed && (
              <form action={logoutAction}>
                <button type="submit" className={btn}>{t('logout')}</button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-[var(--spacing-xl)]">{children}</main>
    </div>
  );
}
