/**
 * @milestones/i18n — Bilingual (en/ar) translation infrastructure
 *
 * Content translations (product names, branch descriptions, editorial) live in Sanity CMS.
 * This package holds UI strings, error messages, navigation labels, and system messages.
 *
 * All content marked [PLACEHOLDER] requires Marketing approval before production use.
 */

export * from './types.js';
export * from './translator.js';
export { en } from './locales/en.js';
export { ar } from './locales/ar.js';
