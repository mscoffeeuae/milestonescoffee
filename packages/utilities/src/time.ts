/**
 * Time utilities — UTC storage, Asia/Dubai for display/scheduling.
 * NEVER store local Dubai time as UTC.
 */

export const DISPLAY_TZ = 'Asia/Dubai' as const;

/** Return the current UTC ISO string */
export function nowUtc(): string {
  return new Date().toISOString();
}

/** Format a UTC date for display in Dubai time */
export function toDisplayTime(utcDate: Date | string, locale: 'en' | 'ar'): string {
  const d = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-AE' : 'ar-AE', {
    timeZone: DISPLAY_TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

/** Format a UTC date as a Dubai date string (no time) */
export function toDisplayDate(utcDate: Date | string, locale: 'en' | 'ar'): string {
  const d = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-AE' : 'ar-AE', {
    timeZone: DISPLAY_TZ,
    dateStyle: 'long',
  }).format(d);
}

/** Convert a Dubai local time (YYYY-MM-DDTHH:mm) to UTC Date */
export function dubaiLocalToUtc(localIso: string): Date {
  // Append Dubai offset for Intl parsing
  const dubaiOffset = getDubaiOffset(new Date(localIso + ':00Z'));
  return new Date(localIso + dubaiOffset);
}

/** Get Dubai UTC offset string (+04:00 or +05:00 during DST — UAE does not observe DST; always +04:00) */
function getDubaiOffset(_date: Date): string {
  return '+04:00';
}
