import { z } from 'zod';

/** Supported locales */
export const LocaleSchema = z.enum(['en', 'ar']);
export type Locale = z.infer<typeof LocaleSchema>;

/** Bilingual string object */
export const BilingualStringSchema = z.object({
  en: z.string(),
  ar: z.string(),
});
export type BilingualString = z.infer<typeof BilingualStringSchema>;

/** Integer fils amount (non-negative integer) */
export const FilsSchema = z
  .number()
  .int('Amount must be an integer number of fils')
  .nonnegative('Amount must be non-negative');
export type Fils = z.infer<typeof FilsSchema>;

/** UUID v4 */
export const UuidSchema = z.string().uuid();

/** Idempotency key — 1–64 chars, alphanumeric + hyphens */
export const IdempotencyKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9-]+$/, 'Idempotency-Key must be alphanumeric with hyphens only');

/** Pagination query params */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

/** Standard API error envelope */
export const ApiErrorSchema = z.object({
  code: z.string(),
  messageKey: z.string(),
  requestId: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
