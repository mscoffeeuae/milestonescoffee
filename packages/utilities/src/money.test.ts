import { describe, it, expect } from 'vitest';
import { aedToFils, filsToAedDisplay, addFils, multiplyFils, assertFils } from './money.js';

describe('aedToFils', () => {
  it('converts decimal AED to integer fils', () => {
    expect(aedToFils('12.50')).toBe(1250);
    expect(aedToFils('0.01')).toBe(1);
    expect(aedToFils('100.00')).toBe(10000);
  });

  it('handles rounding correctly', () => {
    // 10 fils precision
    expect(aedToFils('0.10')).toBe(10);
  });

  it('throws on negative amount', () => {
    expect(() => aedToFils('-1.00')).toThrow();
  });
});

describe('filsToAedDisplay', () => {
  it('formats fils as AED string', () => {
    expect(filsToAedDisplay(1250)).toBe('12.50');
    expect(filsToAedDisplay(0)).toBe('0.00');
    expect(filsToAedDisplay(1)).toBe('0.01');
  });

  it('throws on fractional input', () => {
    expect(() => filsToAedDisplay(1.5)).toThrow();
  });
});

describe('addFils', () => {
  it('adds two fils amounts', () => {
    expect(addFils(100, 200)).toBe(300);
    expect(addFils(0, 500)).toBe(500);
  });
});

describe('multiplyFils', () => {
  it('multiplies and rounds correctly', () => {
    expect(multiplyFils(1000, 1.05)).toBe(1050);
    expect(multiplyFils(1000, 0.1)).toBe(100);
  });
});

describe('assertFils', () => {
  it('passes for valid integer fils', () => {
    expect(() => assertFils(100, 'test')).not.toThrow();
    expect(() => assertFils(0, 'test')).not.toThrow();
  });

  it('throws for float, negative, or non-integer', () => {
    expect(() => assertFils(1.5, 'test')).toThrow();
    expect(() => assertFils(-1, 'test')).toThrow();
    expect(() => assertFils('100', 'test')).toThrow();
  });
});
