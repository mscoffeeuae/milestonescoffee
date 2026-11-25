import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, verifySessionToken } from './session';

export async function isAdmin(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** Second line of defence behind the proxy: every admin page calls this. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}
