import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Supported locales — matches contracts/LocaleSchema */
const SUPPORTED_LOCALES = ['en', 'ar'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Default locale when no preference can be detected */
const DEFAULT_LOCALE: Locale = 'en';

/**
 * Detect preferred locale from Accept-Language header.
 * Returns the first supported locale found, or the default.
 */
function detectLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get('accept-language') ?? '';

  // Parse Accept-Language header (e.g. "ar-AE,ar;q=0.9,en;q=0.8")
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [tag, q] = lang.trim().split(';q=');
      return { lang: (tag ?? '').trim().toLowerCase(), q: parseFloat(q ?? '1') };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of languages) {
    // Match exact locale (ar) or language tag (ar-AE → ar)
    const primary = lang.split('-')[0] as Locale;
    if (SUPPORTED_LOCALES.includes(lang as Locale)) return lang as Locale;
    if (primary && SUPPORTED_LOCALES.includes(primary)) return primary;
  }

  return DEFAULT_LOCALE;
}

/**
 * Locale middleware.
 *
 * Rules:
 * - Root path `/` → redirect to `/{detected-locale}`
 * - Paths without locale prefix → redirect to `/{detected-locale}/path`
 * - Paths with valid locale prefix → pass through unchanged
 * - Static assets and API routes → skip
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a supported locale prefix
  const pathnameLocale = pathname.split('/')[1] as Locale;
  if (SUPPORTED_LOCALES.includes(pathnameLocale)) {
    return NextResponse.next();
  }

  // Redirect to locale-prefixed path
  const locale = detectLocale(request);
  const redirectUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url);

  return NextResponse.redirect(redirectUrl, { status: 307 });
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Files with extensions (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
