/**
 * Prisma generated client stub.
 *
 * In production and CI environments with unrestricted network access,
 * this file is REPLACED by `prisma generate` output which contains the full
 * typed client for the schema in ../prisma/schema.prisma.
 *
 * This stub allows TypeScript to compile in restricted network environments
 * (e.g. Claude Code sandbox where binaries.prisma.sh is blocked, preventing
 * prisma generate from downloading query engine binaries).
 *
 * Full schema implemented in Prompt 5. Run `pnpm db:generate` after `docker compose up -d`.
 * The real generated output will replace this file entirely.
 *
 * Updated in Prompt 6 to expose stub delegates for all 40+ schema models so
 * downstream services type-check correctly without the real generated client.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

/** Minimal stub delegate that accepts any query and returns a resolved Promise. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeDelegate(): Record<string, (...args: AnyArgs[]) => Promise<any>> {
  return new Proxy(
    {},
    {
      get: (_target, _prop) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (..._args: AnyArgs[]) =>
          Promise.resolve(null),
    },
  );
}

/** @stub — replaced by prisma generate */
export class PrismaClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(_options?: any) {}
  $connect(): Promise<void> { return Promise.resolve(); }
  $disconnect(): Promise<void> { return Promise.resolve(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction(arg: any): Promise<any> {
    if (Array.isArray(arg)) return Promise.resolve([]);
    return arg(this);
  }

  // ── Catalog ──────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get branch(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get branchHours(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get branchClosure(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get branchService(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get category(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get product(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get productVariant(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get modifierGroup(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get modifierOption(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get productModifierGroup(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get branchProduct(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get inventoryItem(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get productMedia(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get productAllergen(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get integrationMapping(): any { return makeDelegate(); }

  // ── Customer & Commerce ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get customer(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get customerAddress(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get customerConsent(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get customerDeletionRequest(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get cart(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get cartItem(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get cartItemModifier(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get checkoutQuote(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get order(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get orderItem(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get orderItemModifier(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get orderEvent(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get payment(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get refund(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get inventoryReservation(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get pickupReservation(): any { return makeDelegate(); }

  // ── Loyalty & Corporate ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get loyaltyAccount(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get loyaltyTransaction(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get loyaltyRule(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get reward(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get redemption(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get giftCard(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get giftCardTransaction(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get promotion(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get promotionRedemption(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get corporateAccount(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get corporateEnquiry(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get corporateQuote(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get subscription(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get subscriptionCycle(): any { return makeDelegate(); }

  // ── Advanced Experiences (Prompt 11) ────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get branchFeatureFlag(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get qrCode(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get qrCodeScanLog(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get recommendationEvent(): any { return makeDelegate(); }

  // ── Admin & Integration ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get staffUser(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get auditLog(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get outboxEvent(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get webhookInbox(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get idempotencyKey(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get notificationDelivery(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get apiIntegrationCredential(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get scheduledJob(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get integrationAttempt(): any { return makeDelegate(); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get reconciliationRun(): any { return makeDelegate(); }
}

/** Enum stubs — replaced by prisma generate */
export const QrCodeType = {
  TABLE_ORDER: 'TABLE_ORDER',
  LOYALTY_CHECKIN: 'LOYALTY_CHECKIN',
  PROMOTION: 'PROMOTION',
  TAKEAWAY_PICKUP: 'TAKEAWAY_PICKUP',
} as const;
export type QrCodeType = typeof QrCodeType[keyof typeof QrCodeType];

export const QrCodeStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  EXPIRED: 'EXPIRED',
} as const;
export type QrCodeStatus = typeof QrCodeStatus[keyof typeof QrCodeStatus];

export const RecommendationEventType = {
  VIEW: 'VIEW',
  ADD_TO_CART: 'ADD_TO_CART',
  PURCHASE: 'PURCHASE',
  SKIP: 'SKIP',
} as const;
export type RecommendationEventType = typeof RecommendationEventType[keyof typeof RecommendationEventType];

/** @stub — replaced by prisma generate */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Prisma {
  export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
  export type JsonObject = { [key: string]: JsonValue };
  export type JsonArray = JsonValue[];
}
