import { z } from 'zod';
import { FilsSchema, UuidSchema } from './common.js';

/** Order state machine — server-side only; never computed client-side */
export const OrderStatusSchema = z.enum([
  'PENDING_PAYMENT',
  'CONFIRMED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/** Valid order state transitions */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
} as const;

export function isValidOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export const FulfillmentTypeSchema = z.enum(['PICKUP', 'DINE_IN']);
export type FulfillmentType = z.infer<typeof FulfillmentTypeSchema>;

export const OrderItemModifierSchema = z.object({
  modifierOptionId: UuidSchema,
  priceDeltaFils: FilsSchema,
  name: z.object({ en: z.string(), ar: z.string() }),
});

export const OrderItemSchema = z.object({
  id: UuidSchema,
  productVariantId: UuidSchema,
  quantity: z.number().int().positive(),
  unitPriceFils: FilsSchema,
  totalFils: FilsSchema,
  modifiers: z.array(OrderItemModifierSchema),
  specialInstructions: z.string().max(200).optional(),
});

export const OrderSummarySchema = z.object({
  id: UuidSchema,
  branchId: UuidSchema,
  status: OrderStatusSchema,
  fulfillmentType: FulfillmentTypeSchema,
  subtotalFils: FilsSchema,
  discountFils: FilsSchema,
  taxFils: FilsSchema,
  totalFils: FilsSchema,
  items: z.array(OrderItemSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type OrderSummary = z.infer<typeof OrderSummarySchema>;
