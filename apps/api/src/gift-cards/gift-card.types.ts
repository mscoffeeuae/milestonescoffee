/**
 * Gift card domain types.
 *
 * Policy constraints (D-010 pending — these are stubs):
 *   - Minimum denomination: TBD (default 50 AED = 5000 fils)
 *   - Maximum denomination: TBD (default 500 AED = 50000 fils)
 *   - Expiry: TBD (no expiry = null by default)
 *   - Reload: TBD (disabled by default — GIFT_CARD_RELOAD_ENABLED flag)
 *   - Partial redemption: allowed (balance tracks remaining fils)
 *   - Anonymous issuance: allowed (issuedTo = null)
 *
 * Security:
 *   - Gift card codes are HIGH-ENTROPY random strings (not sequential)
 *   - Only the SHA-256 digest (codeDigest) is stored; the plaintext code
 *     is returned ONCE at issuance and is irrecoverable thereafter
 *   - Balance is a PROJECTION — authoritative figure comes from ledger SUM
 *
 * Blocking: D-010 (gift card policies) must be resolved before go-live.
 */

export interface IssueGiftCardInput {
  amountFils: number;          // Must be positive integer fils
  recipientEmail?: string | undefined;
  customerId?: string | undefined;
  note?: string | undefined;
}

export interface GiftCardDto {
  id: string;
  status: string;
  balanceFils: number;
  expiresAt: string | null;
  issuedTo: string | null;
  createdAt: string;
}

export interface GiftCardIssuedDto extends GiftCardDto {
  code: string;  // Plaintext code — returned ONCE; not stored
}

export interface RedeemGiftCardInput {
  code: string;
  amountFils: number;
  orderId?: string | undefined;
  idempotencyKey: string;
}

export interface RedemptionResultDto {
  success: boolean;
  giftCardId: string;
  redeemedFils: number;
  remainingFils: number;
}

export interface GiftCardBalanceDto {
  id: string;
  status: string;
  balanceFils: number;
  expiresAt: string | null;
}
