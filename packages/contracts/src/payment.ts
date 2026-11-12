import { z } from 'zod';
import { FilsSchema, UuidSchema } from './common.ts';

/** Payment state machine — server-side only */
export const PaymentStatusSchema = z.enum([
  'PENDING',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'CANCELLED',
  'REFUND_PENDING',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  PENDING: ['AUTHORIZED', 'FAILED', 'CANCELLED'],
  AUTHORIZED: ['CAPTURED', 'CANCELLED'],
  CAPTURED: ['REFUND_PENDING', 'REFUNDED', 'PARTIALLY_REFUNDED'],
  FAILED: [],
  CANCELLED: [],
  REFUND_PENDING: ['REFUNDED', 'PARTIALLY_REFUNDED'],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ['REFUNDED'],
} as const;

export function isValidPaymentTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

export const PaymentSummarySchema = z.object({
  id: UuidSchema,
  orderId: UuidSchema,
  status: PaymentStatusSchema,
  amountFils: FilsSchema,
  currency: z.literal('AED'),
  providerReference: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type PaymentSummary = z.infer<typeof PaymentSummarySchema>;
