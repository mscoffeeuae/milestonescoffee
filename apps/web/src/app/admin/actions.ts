'use server';

import { logActivity } from '@/lib/admin/activity';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, createSessionToken } from '@/lib/admin/session';
import { MIN_PASSWORD_LENGTH, passwordConfigured, savePassword, verifyPassword } from '@/lib/admin/auth-store';
import { requireAdmin } from '@/lib/admin/guard';
import { ADMIN_LANG_COOKIE } from '@/lib/admin/i18n';

export async function loginAction(formData: FormData): Promise<void> {
  if (!(await passwordConfigured())) redirect('/admin/login?error=config');
  const password = String(formData.get('password') ?? '');
  if (!(await verifyPassword(password))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    redirect('/admin/login?error=1');
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    // Browsers drop Secure cookies on plain-http dev servers other than localhost.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: ADMIN_SESSION_SECONDS,
  });
  redirect('/admin');
}

/** Session cookie is left untouched; result is reported via ?pw=… on the settings page. */
export async function changePasswordAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  const done = (code: string): never => redirect(`/admin/settings?pw=${code}`);

  if (!(await verifyPassword(current))) {
    await new Promise((r) => setTimeout(r, 800));
    done('wrong');
  }
  if (next !== confirm) done('mismatch');
  if (next.length < MIN_PASSWORD_LENGTH) done('short');
  if (next === current) done('same');
  try {
    await savePassword(next);
  } catch (err) {
    console.error('[admin] could not save password', err instanceof Error ? err.message : err);
    done('error');
  }
  await logActivity({ action: 'settings', entityType: 'settings', label: 'Admin password', detail: 'Password changed' });
  done('ok');
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: '/admin' });
  redirect('/admin/login');
}

export async function setLangAction(formData: FormData): Promise<void> {
  const to = formData.get('to') === 'ar' ? 'ar' : 'en';
  (await cookies()).set(ADMIN_LANG_COOKIE, to, { path: '/admin', maxAge: 60 * 60 * 24 * 365, sameSite: 'strict' });
  const ref = (await headers()).get('referer');
  let back = '/admin';
  try {
    if (ref) {
      const u = new URL(ref);
      if (u.pathname.startsWith('/admin')) back = u.pathname + u.search;
    }
  } catch { /* fall through to /admin */ }
  redirect(back);
}
