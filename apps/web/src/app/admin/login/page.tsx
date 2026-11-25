import { redirect } from 'next/navigation';
import { loginAction } from '../actions';
import { isAdmin } from '@/lib/admin/guard';
import { getT } from '@/lib/admin/lang';
import { Card } from '@/components/admin/ui';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect('/admin');
  const { error } = await searchParams;
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-sm">
      <Card title={t('login')}>
        <form action={loginAction} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-text-secondary)]">{t('password')}</span>
            <input
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-base)] px-3 py-2 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-[var(--color-error)]">
              {error === 'config' ? t('notConfigured') : t('wrongPassword')}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-[var(--radius-md)] bg-[var(--color-interactive)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-interactive-hover)]"
          >
            {t('login')}
          </button>
        </form>
      </Card>
    </div>
  );
}
