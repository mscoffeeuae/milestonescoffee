/**
 * Shared error codes — used in API error envelopes.
 * messageKey maps to i18n translation keys.
 */
export const ERROR_CODES = {
  // Validation
  VALIDATION_ERROR: 'error.validation',
  INVALID_INPUT: 'error.invalidInput',

  // Auth
  UNAUTHORIZED: 'error.unauthorized',
  FORBIDDEN: 'error.forbidden',
  TOKEN_EXPIRED: 'error.tokenExpired',

  // Resources
  NOT_FOUND: 'error.notFound',
  CONFLICT: 'error.conflict',

  // Business rules
  ITEM_UNAVAILABLE: 'error.itemUnavailable',
  INSUFFICIENT_STOCK: 'error.insufficientStock',
  BRANCH_CLOSED: 'error.branchClosed',
  ORDERING_DISABLED: 'error.orderingDisabled',
  GIFT_CARD_BALANCE_INSUFFICIENT: 'error.giftCardInsufficient',
  LOYALTY_POINTS_INSUFFICIENT: 'error.loyaltyInsufficient',
  COUPON_EXPIRED: 'error.couponExpired',
  COUPON_EXHAUSTED: 'error.couponExhausted',
  ORDER_STATE_CONFLICT: 'error.orderStateConflict',
  PAYMENT_STATE_CONFLICT: 'error.paymentStateConflict',
  DUPLICATE_ORDER: 'error.duplicateOrder',

  // Rate limiting
  RATE_LIMITED: 'error.rateLimited',

  // Internal
  INTERNAL_ERROR: 'error.internal',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
