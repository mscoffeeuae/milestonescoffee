/**
 * Checkout domain types.
 *
 * CheckoutQuote is an IMMUTABLE snapshot of prices at the moment the customer
 * confirmed their cart. Once persisted it may never be recalculated. The
 * quote drives the Order total; the Order drives the Payment amount.
 *
 * Blocking decisions:
 *   D-005 — payment gateway (gateway-specific action object)
 *   D-007 — tax policy (taxFils currently 0, see PRICING_POLICY_VERSION)
 *   D-008 — guest ordering policy (guestCartToken flow)
 */

/** An immutable price snapshot for one line of a checkout quote. */
export interface CheckoutLineSnapshot {
  variantId: string;
  variantSku: string;
  variantLabelEn: string;
  variantLabelAr: string;
  unitPriceFils: number;
  quantity: number;
  modifierOptionIds: string[];
  modifierDeltaFils: number;
  lineTotalFils: number;
}

/** Immutable checkout quote — created on POST /checkout/quotes. */
export interface CheckoutQuoteDto {
  id: string;
  branchId: string;
  lines: CheckoutLineSnapshot[];
  subtotalFils: number;
  discountFils: number; // 0 until Prompt 10
  taxFils: number; // 0 pending D-007
  totalFils: number;
  pricingPolicyVersion: string;
  expiresAt: Date;
  acceptedAt: Date | null;
}

/** Request body for POST /checkout/quotes. */
export interface CreateQuoteInput {
  cartId: string;
  /** Raw guest token (if cart is a guest cart). Hashed before lookup. */
  guestCartToken?: string | undefined;
}

/** Request body for POST /checkout/orders. */
export interface CreateOrderInput {
  quoteId: string;
  serviceType: string; // 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  tableNumber?: string | undefined;
  deliveryAddressId?: string | undefined;
  note?: string | undefined;
  idempotencyKey: string; // Required — Idempotency-Key header
}

/** Minimal order response returned from POST /checkout/orders. */
export interface OrderCreatedDto {
  orderId: string;
  orderNumber: string;
  status: string;
  totalFils: number;
  branchId: string;
  /** Next step for the client (gateway-specific). Stub returns type:'noop' until D-005. */
  paymentAction: PaymentAction;
}

/** Payment action hint for the client. Gateway-specific shape pending D-005. */
export interface PaymentAction {
  type: 'noop' | 'redirect' | 'iframe' | 'sdk';
  /** Populated once D-005 gateway is wired. */
  url?: string | undefined;
  clientSecret?: string | undefined;
}
