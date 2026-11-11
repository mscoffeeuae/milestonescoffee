import type { Locale, TranslationDict } from './types.js';
import { en } from './locales/en.js';
import { ar } from './locales/ar.js';

const dictionaries: Record<Locale, TranslationDict> = { en, ar };

/** Get translation dictionary for a locale */
export function getDict(locale: Locale): TranslationDict {
  return dictionaries[locale];
}

/** Simple nested key accessor — returns key string on miss instead of throwing */
export function t(locale: Locale, ...keys: string[]): string {
  let node: unknown = dictionaries[locale];
  for (const key of keys) {
    if (typeof node !== 'object' || node === null) return keys.join('.');
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === 'string' ? node : keys.join('.');
}
