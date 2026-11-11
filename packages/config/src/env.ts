import { z } from 'zod';

/** Base environment schema — common to all apps */
const BaseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),
});

/** API server environment */
const ApiEnvSchema = BaseEnvSchema.extend({
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required').default('redis://localhost:6379'),
  AUTH_ISSUER_URL: z.string().url().optional(),
  AUTH_AUDIENCE: z.string().optional(),
  AUTH_JWKS_URI: z.string().url().optional(),
  SANITY_PROJECT_ID: z.string().optional(),
  SANITY_DATASET: z.string().default('production'),
  SANITY_API_TOKEN: z.string().optional(),
  SANITY_PREVIEW_SECRET: z.string().optional(),
  // Payment gateway (TBD — keep optional until D-005 resolved)
  PAYMENT_PROVIDER: z.string().optional(),
  PAYMENT_SECRET_KEY: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  // POS (TBD — keep optional until D-006 resolved)
  POS_PROVIDER: z.string().optional(),
  POS_API_URL: z.string().url().optional(),
  POS_API_KEY: z.string().optional(),
  POS_WEBHOOK_SECRET: z.string().optional(),
  // Object storage (TBD)
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_REGION: z.string().optional(),
  // Notifications (TBD)
  NOTIFICATIONS_PROVIDER: z.string().optional(),
  NOTIFICATIONS_API_KEY: z.string().optional(),
  NOTIFICATIONS_FROM_EMAIL: z.string().email().optional(),
  NOTIFICATIONS_FROM_PHONE: z.string().optional(),
  // Feature flags
  FEATURE_ORDERING_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  FEATURE_GIFT_CARDS_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  FEATURE_LOYALTY_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  FEATURE_SUBSCRIPTIONS_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  FEATURE_QR_ORDERING_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;

/** Next.js web/admin environment (public + server vars) */
const WebEnvSchema = BaseEnvSchema.extend({
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url()
    .default('http://localhost:4000/api/v1'),
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_SANITY_DATASET: z.string().default('production'),
  NEXT_PUBLIC_MAPS_BROWSER_API_KEY: z.string().optional(),
  // Server-side only in Next.js
  SANITY_API_TOKEN: z.string().optional(),
  SANITY_PREVIEW_SECRET: z.string().optional(),
});

export type WebEnv = z.infer<typeof WebEnvSchema>;

/**
 * Parse and validate API environment.
 * Call once at startup — throws descriptive error on failure.
 */
export function parseApiEnv(raw: Record<string, string | undefined> = process.env): ApiEnv {
  const result = ApiEnvSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

/**
 * Parse and validate web environment.
 * Call once at startup — throws descriptive error on failure.
 */
export function parseWebEnv(raw: Record<string, string | undefined> = process.env): WebEnv {
  const result = WebEnvSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
