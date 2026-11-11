/**
 * Payment domain types.
 *
 * All payment operations are STUB pending D-005 (payment gateway selection).
 * The state machine is enforced; gateway interactions throw NotImplementedException.
 *
 * Payment states (from schema):
 *   PENDING → AUTHORIZED → CAPTURED → FAILED / PARTIALLY_REFUNDED / REFUNDED / VOIDED
 *
 * Refund states:
 *   PENDING → SUCCEEDED / FAILED
 *
 * Financial rule: Payment and Refund records are the financial authority.
 * Order totals (subtotalFils, taxFils, etc.) are NEVER recalculated from items
 * after the order is confirmed.
 */

/** Request body for POST /payments/intents */
export interface CreatePaymentIntentInput {
  orderId: string;
  /** Payment method selected by customer. Stub: only 'card' accepted. */
  method: string;
}

/** Response from POST /payments/intents */
export interface PaymentIntentDto {
  id: string;
  orderId: string;
  status: string;
  amountFils: number;
  /** Gateway-specific action — pending D-005. */
  action: PaymentActionDto;
  createdAt: Date;
}

export interface PaymentActionDto {
  type: 'noop' | 'redirect' | 'iframe' | 'sdk';
  url?: string | undefined;
  clientSecret?: string | undefined;
}

/** Webhook payload from payment provider — shape is provider-specific. */
export interface WebhookPayload {
  provider: string;
  rawBody: Buffer;
  signature: string;
}

/** Request body for POST /orders/:id/refunds */
export interface CreateRefundInput {
  amountFils: number;
  reason: string;
  note?: string | undefined;
  idempotencyKey: string;
}

/** Refund response */
export interface RefundDto {
  id: string;
  orderId: string;
  amountFils: number;
  status: string;
  reason: string;
  createdAt: Date;
}
