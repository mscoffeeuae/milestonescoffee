'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  adminConfigured,
  checkPassword,
  createSessionToken,
} from '@/lib/admin/session';
import { ADMIN_LANG_COOKIE } from '@/lib/admin/i18n';

export async function loginAction(formData: FormData): Promise<void> {
  if (!adminConfigured()) redirect('/admin/login?error=config');
  const password = String(formData.get('password') ?? '');
  if (!(await checkPassword(password))) {
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
