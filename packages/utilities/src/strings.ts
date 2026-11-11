/**
 * String utilities — slugification, truncation, bilingual helpers.
 */

/** Generate a URL-safe ASCII slug from an English string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Truncate a string to maxLength, appending ellipsis if truncated */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/** Mask all but the last N characters of a string (for gift card codes, etc.) */
export function maskEnd(value: string, visibleCount: number, maskChar = '•'): string {
  if (value.length <= visibleCount) return value;
  return maskChar.repeat(value.length - visibleCount) + value.slice(-visibleCount);
}

/** Check if a string is a valid E.164 UAE phone number */
export function isValidUaePhone(phone: string): boolean {
  // UAE: +971 followed by 9 digits
  return /^\+971[0-9]{9}$/.test(phone);
}

/** Determine text direction from locale */
export function getTextDir(locale: 'en' | 'ar'): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
