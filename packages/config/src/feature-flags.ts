/**
 * Feature flag helpers — all Phase 2+ features require explicit enablement per branch.
 * Default: ALL flags disabled unless explicitly set to true.
 *
 * See docs/DEPLOYMENT.md for the feature flag table and R-08 (feature flag runbook).
 */

export interface FeatureFlags {
  ordering: boolean;
  giftCards: boolean;
  loyalty: boolean;
  subscriptions: boolean;
  qrOrdering: boolean;
}

/** Parse feature flags from environment (safe to call server-side only) */
export function parseFeatureFlags(env: Record<string, string | undefined> = process.env): FeatureFlags {
  return {
    ordering: env['FEATURE_ORDERING_ENABLED'] === 'true',
    giftCards: env['FEATURE_GIFT_CARDS_ENABLED'] === 'true',
    loyalty: env['FEATURE_LOYALTY_ENABLED'] === 'true',
    subscriptions: env['FEATURE_SUBSCRIPTIONS_ENABLED'] === 'true',
    qrOrdering: env['FEATURE_QR_ORDERING_ENABLED'] === 'true',
  };
}

/** All flags disabled — use in tests and mocks */
export const ALL_FLAGS_DISABLED: FeatureFlags = {
  ordering: false,
  giftCards: false,
  loyalty: false,
  subscriptions: false,
  qrOrdering: false,
};
