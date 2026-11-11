/**
 * PromotionService unit tests.
 * Direct instantiation pattern (Vitest ESM DI issue).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromotionService } from './promotion.service.js';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePromotion(partial: Record<string, unknown> = {}) {
  return {
    id: 'promo-1',
    nameEn: '10% Off',
    nameAr: 'خصم 10%',
    code: 'SAVE10',
    validFrom: new Date(Date.now() - 86400_000), // yesterday
    validUntil: new Date(Date.now() + 86400_000 * 30), // 30 days ahead
    usageLimit: 100,
    isActive: true,
    _count: { promotionRedemptions: 5 },
    ...partial,
  };
}

function makeDb() {
  return {
    client: {
      promotion: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      promotionRedemption: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ promotionId: 'promo-1', orderId: 'order-1', discountFils: 0 }),
      },
      $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
        const tx = {
          promotionRedemption: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ promotionId: 'promo-1', orderId: 'order-1', discountFils: 0 }),
          },
        };
        return fn(tx);
      }),
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PromotionService', () => {
  let service: PromotionService;
  let db: ReturnType<typeof makeDb>;

  beforeEach(() => {
    db = makeDb();
    service = new PromotionService(db as any);
  });

  // -------------------------------------------------------------------------
  // validateCode
  // -------------------------------------------------------------------------

  describe('validateCode', () => {
    it('throws NotFoundException for unknown code', async () => {
      db.client.promotion.findFirst.mockResolvedValue(null);
      await expect(service.validateCode('INVALID')).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException for not-started promotion', async () => {
      db.client.promotion.findFirst.mockResolvedValue(
        makePromotion({ validFrom: new Date(Date.now() + 86400_000) }),
      );
      await expect(service.validateCode('SAVE10')).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException for expired promotion', async () => {
      db.client.promotion.findFirst.mockResolvedValue(
        makePromotion({ validUntil: new Date(Date.now() - 86400_000) }),
      );
      await expect(service.validateCode('SAVE10')).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException when usage limit reached', async () => {
      db.client.promotion.findFirst.mockResolvedValue(
        makePromotion({ usageLimit: 10, _count: { promotionRedemptions: 10 } }),
      );
      await expect(service.validateCode('SAVE10')).rejects.toThrow(UnprocessableEntityException);
    });

    it('returns promotion dto for valid code', async () => {
      db.client.promotion.findFirst.mockResolvedValue(makePromotion());

      const result = await service.validateCode('SAVE10');

      expect(result.id).toBe('promo-1');
      expect(result.nameEn).toBe('10% Off');
    });
  });

  // -------------------------------------------------------------------------
  // applyPromotion (D-009 stub — always 0)
  // -------------------------------------------------------------------------

  describe('applyPromotion', () => {
    it('throws NotFoundException for unknown promotion', async () => {
      db.client.promotion.findUnique.mockResolvedValue(null);
      await expect(
        service.applyPromotion({ promotionId: 'bad', orderId: 'o1', orderTotalFils: 10_000, branchId: 'b1', idempotencyKey: 'k1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException for inactive promotion', async () => {
      db.client.promotion.findUnique.mockResolvedValue(makePromotion({ isActive: false }));
      await expect(
        service.applyPromotion({ promotionId: 'promo-1', orderId: 'o1', orderTotalFils: 10_000, branchId: 'b1', idempotencyKey: 'k1' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('returns discountFils=0 (D-009 stub)', async () => {
      db.client.promotion.findUnique.mockResolvedValue(makePromotion());
      db.client.promotionRedemption.findUnique.mockResolvedValue(null);

      const result = await service.applyPromotion({
        promotionId: 'promo-1', orderId: 'order-1', orderTotalFils: 50_000, branchId: 'b1', idempotencyKey: 'k1',
      });

      expect(result.discountFils).toBe(0);
    });

    it('returns idempotent result for duplicate application', async () => {
      db.client.promotion.findUnique.mockResolvedValue(makePromotion());
      db.client.promotionRedemption.findUnique.mockResolvedValue({
        promotionId: 'promo-1', orderId: 'order-1', discountFils: 0,
      });

      const result = await service.applyPromotion({
        promotionId: 'promo-1', orderId: 'order-1', orderTotalFils: 50_000, branchId: 'b1', idempotencyKey: 'dup-key',
      });

      expect(result.promotionId).toBe('promo-1');
      expect(result.discountFils).toBe(0);
    });
  });
});
