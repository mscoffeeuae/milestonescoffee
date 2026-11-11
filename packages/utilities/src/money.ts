/**
 * Monetary utilities — integer fils only (1 AED = 100 fils).
 * NEVER use floating-point for AED amounts.
 * All amounts stored and transmitted as integer fils.
 */

/** Assert value is a safe integer fils amount */
export function assertFils(value: unknown, label: string): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a non-negative integer fils, got: ${value}`);
  }
}

/** Convert AED decimal string to fils (integer). E.g. "12.50" → 1250 */
export function aedToFils(aed: string): number {
  const parsed = parseFloat(aed);
  if (!isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid AED amount: ${aed}`);
  }
  // Round to avoid floating-point drift
  return Math.round(parsed * 100);
}

/** Format fils as AED display string. E.g. 1250 → "12.50" */
export function filsToAedDisplay(fils: number): string {
  assertFils(fils, 'filsToAedDisplay');
  return (fils / 100).toFixed(2);
}

/** Format fils as localized currency string. E.g. 1250, 'en' → "AED 12.50" */
export function formatCurrency(fils: number, locale: 'en' | 'ar'): string {
  assertFils(fils, 'formatCurrency');
  const aed = fils / 100;
  return new Intl.NumberFormat(locale === 'en' ? 'en-AE' : 'ar-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
  }).format(aed);
}

/** Add two fils amounts safely */
export function addFils(a: number, b: number): number {
  assertFils(a, 'addFils:a');
  assertFils(b, 'addFils:b');
  return a + b;
}

/** Multiply fils by a decimal factor and round. E.g. 1000 fils × 1.05 (VAT) → 1050 */
export function multiplyFils(fils: number, factor: number): number {
  assertFils(fils, 'multiplyFils');
  return Math.round(fils * factor);
}
