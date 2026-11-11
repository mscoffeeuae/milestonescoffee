/**
 * CheckoutService unit tests — direct instantiation (avoids NestJS DI in Vitest).
 */
import { vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CheckoutService } from './checkout.service.js';

function makeDb() {
  const noop = () => Promise.resolve(null);
  return {
    client: {
      checkoutQuote: { create: noop, findUnique: noop, update: noop },
      order: { findUnique: noop },
      orderItem: { create: noop },
      orderItemModifier: { createMany: noop },
      orderEvent: { create: noop },
      idempotencyKey: { create: noop, findUnique: noop },
      $transaction: (fn: unknown) => typeof fn === 'function' ? fn({
        checkoutQuote: { update: noop },
        order: { create: noop, update: noop },
        orderItem: { create: noop },
        orderItemModifier: { createMany: noop },
        orderEvent: { create: noop },
        idempotencyKey: { create: noop },
      }) : Promise.resolve([]),
    },
  };
}

describe('CheckoutService', () => {
  let service: CheckoutService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cartService: any;

  beforeEach(() => {
    cartService = { findById: vi.fn(), findByGuestToken: vi.fn() };
    const pricingService = {
      priceLine: vi.fn().mockResolvedValue({ unitPriceFils: 1500, lineTotalFils: 3000 }),
      quoteCart: vi.fn().mockResolvedValue({ subtotalFils: 3000, discountFils: 0, taxFils: 0, totalFils: 3000 }),
    };
    const menuService = {
      listByBranch: vi.fn().mockResolvedValue([{
        variantId: 'v1', variantSku: 'SKU-001', variantLabelEn: 'Espresso',
        variantLabelAr: '[PLACEHOLDER]', priceFils: 1500,
      }]),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new CheckoutService(makeDb() as any, pricingService as any, menuService as any, cartService as any);
  });

  describe('createQuote', () => {
    it('throws BadRequest when cart has no branch', async () => {
      cartService.findById.mockResolvedValue({
        id: 'cart1', branchId: null, version: 0, expiresAt: new Date(), items: [],
      });
      await expect(service.createQuote({ cartId: 'cart1' }))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when cart is empty', async () => {
      cartService.findById.mockResolvedValue({
        id: 'cart1', branchId: 'branch1', version: 0, expiresAt: new Date(), items: [],
      });
      await expect(service.createQuote({ cartId: 'cart1' }))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a quote when cart has items and branch', async () => {
      cartService.findById.mockResolvedValue({
        id: 'cart1', branchId: 'branch1', version: 0,
        expiresAt: new Date(Date.now() + 86400000),
        items: [{ id: 'item1', variantId: 'v1', quantity: 2, modifierOptionIds: [] }],
      });
      const quote = await service.createQuote({ cartId: 'cart1' });
      expect(quote.pricingPolicyVersion).toBe('v0-pretax-stub');
      expect(quote.discountFils).toBe(0);
      expect(quote.taxFils).toBe(0);
    });
  });

  describe('cancelOrder', () => {
    it('throws NotFoundException for unknown order', async () => {
      await expect(service.cancelOrder('order-id'))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
