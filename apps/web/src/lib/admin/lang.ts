import { cookies } from 'next/headers';
import { ADMIN_LANG_COOKIE, makeT, type AdminLang } from './i18n';

export async function getLang(): Promise<AdminLang> {
  return (await cookies()).get(ADMIN_LANG_COOKIE)?.value === 'ar' ? 'ar' : 'en';
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: makeT(lang), dir: lang === 'ar' ? ('rtl' as const) : ('ltr' as const) };
}

/** Dubai-time display for UTC instants. */
export function formatDubai(iso: string | null, lang: AdminLang): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-GB', {
    timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(iso));
}
