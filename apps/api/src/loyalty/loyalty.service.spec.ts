/**
 * LoyaltyService unit tests.
 * Direct instantiation pattern (Vitest ESM DI issue).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoyaltyService } from './loyalty.service.js';
import { NotFoundException, UnprocessableEntityException, BadRequestException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAccount(partial: Record<string, unknown> = {}) {
  return {
    id: 'acct-1',
    customerId: 'cust-1',
    balanceProjection: 1000,
    tier: 'STANDARD',
    ...partial,
  };
}

function makeReward(partial: Record<string, unknown> = {}) {
  return {
    id: 'reward-1',
    nameEn: 'Free Coffee',
    pointsCost: 500,
    isActive: true,
    validUntil: null,
    ...partial,
  };
}

function makeDb() {
  return {
    client: {
      loyaltyAccount: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(makeAccount()),
        update: vi.fn().mockResolvedValue(makeAccount()),
      },
      loyaltyTransaction: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
      reward: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      redemption: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'redemption-1', status: 'RESERVED', rewardId: 'reward-1', pointsSpent: 500, orderId: null }),
        update: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
        const tx = {
          loyaltyAccount: {
            findUnique: vi.fn().mockResolvedValue(makeAccount()),
            create: vi.fn().mockResolvedValue(makeAccount()),
            update: vi.fn().mockResolvedValue(makeAccount()),
          },
          loyaltyTransaction: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({}),
          },
          redemption: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: 'redemption-1', status: 'RESERVED', rewardId: 'reward-1', pointsSpent: 500, orderId: null }),
            update: vi.fn().mockResolvedValue({}),
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

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let db: ReturnType<typeof makeDb>;

  beforeEach(() => {
    db = makeDb();
    service = new LoyaltyService(db as any);
  });

  // -------------------------------------------------------------------------
  // getOrCreateAccount
  // -------------------------------------------------------------------------

  describe('getOrCreateAccount', () => {
    it('returns existing account if present', async () => {
      db.client.loyaltyAccount.findUnique.mockResolvedValue(makeAccount());

      const result = await service.getOrCreateAccount('cust-1');

      expect(result.balancePoints).toBe(1000);
      expect(result.tier).toBe('STANDARD');
    });

    it('creates account if not present', async () => {
      db.client.loyaltyAccount.findUnique.mockResolvedValue(null);
      db.client.loyaltyAccount.create.mockResolvedValue(makeAccount({ balanceProjection: 0 }));

      const result = await service.getOrCreateAccount('cust-new');

      expect(result.balancePoints).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // getBalance
  // -------------------------------------------------------------------------

  describe('getBalance', () => {
    it('throws NotFoundException if no account', async () => {
      db.client.loyaltyAccount.findUnique.mockResolvedValue(null);
      await expect(service.getBalance('cust-404')).rejects.toThrow(NotFoundException);
    });

    it('returns balance', async () => {
      db.client.loyaltyAccount.findUnique.mockResolvedValue(makeAccount({ balanceProjection: 750 }));

      const result = await service.getBalance('cust-1');

      expect(result.balancePoints).toBe(750);
    });
  });

  // -------------------------------------------------------------------------
  // earnForOrder
  // -------------------------------------------------------------------------

  describe('earnForOrder', () => {
    it('returns 0 points for zero order total', async () => {
      const result = await service.earnForOrder({
        customerId: 'cust-1', orderId: 'order-1', orderTotalFils: 0, idempotencyKey: 'key-1',
      });
      expect(result.pointsEarned).toBe(0);
    });

    it('earns 1 point per 100 fils (D-009 stub rate)', async () => {
      db.client.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          loyaltyTransaction: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}) },
          loyaltyAccount: {
            findUnique: vi.fn().mockResolvedValue(makeAccount()),
            create: vi.fn().mockResolvedValue(makeAccount()),
            update: vi.fn().mockResolvedValue(makeAccount()),
          },
        };
        return fn(tx);
      });

      const result = await service.earnForOrder({
        customerId: 'cust-1', orderId: 'order-2', orderTotalFils: 50_000, idempotencyKey: 'key-2',
      });

      expect(result.pointsEarned).toBe(500); // 50,000 fils / 100 = 500 pts
    });

    it('returns existing points on duplicate orderId (idempotency)', async () => {
      db.client.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          loyaltyTransaction: {
            findUnique: vi.fn().mockResolvedValue({ points: 300 }),
            create: vi.fn(),
          },
          loyaltyAccount: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
        };
        return fn(tx);
      });

      const result = await service.earnForOrder({
        customerId: 'cust-1', orderId: 'dup-order', orderTotalFils: 30_000, idempotencyKey: 'key-3',
      });

      expect(result.pointsEarned).toBe(300);
    });
  });

  // -------------------------------------------------------------------------
  // reserveRedemption
  // -------------------------------------------------------------------------

  describe('reserveRedemption', () => {
    it('throws NotFoundException for unknown reward', async () => {
      db.client.reward.findUnique.mockResolvedValue(null);
      await expect(
        service.reserveRedemption({ customerId: 'cust-1', rewardId: 'bad-reward', idempotencyKey: 'key-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException for inactive reward', async () => {
      db.client.reward.findUnique.mockResolvedValue(makeReward({ isActive: false }));
      await expect(
        service.reserveRedemption({ customerId: 'cust-1', rewardId: 'reward-1', idempotencyKey: 'key-1' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException for insufficient points', async () => {
      db.client.reward.findUnique.mockResolvedValue(makeReward({ pointsCost: 2000 }));
      db.client.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          loyaltyAccount: {
            findUnique: vi.fn().mockResolvedValue(makeAccount({ balanceProjection: 100 })),
          },
          redemption: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn() },
          loyaltyTransaction: { create: vi.fn() },
        };
        return fn(tx);
      });

      await expect(
        service.reserveRedemption({ customerId: 'cust-1', rewardId: 'reward-1', idempotencyKey: 'key-1' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // -------------------------------------------------------------------------
  // commitRedemption
  // -------------------------------------------------------------------------

  describe('commitRedemption', () => {
    it('throws NotFoundException for unknown redemption', async () => {
      db.client.redemption.findUnique.mockResolvedValue(null);
      await expect(service.commitRedemption('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException for non-RESERVED redemption', async () => {
      db.client.redemption.findUnique.mockResolvedValue({ id: 'r1', status: 'COMMITTED' });
      await expect(service.commitRedemption('r1')).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // -------------------------------------------------------------------------
  // adjustPoints
  // -------------------------------------------------------------------------

  describe('adjustPoints', () => {
    it('throws BadRequestException for zero adjustment', async () => {
      await expect(service.adjustPoints('cust-1', 0, 'note', 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('throws UnprocessableEntityException if adjustment makes balance negative', async () => {
      db.client.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          loyaltyAccount: {
            findUnique: vi.fn().mockResolvedValue(makeAccount({ balanceProjection: 100 })),
            update: vi.fn(),
          },
          loyaltyTransaction: { create: vi.fn() },
        };
        return fn(tx);
      });

      await expect(service.adjustPoints('cust-1', -500, 'correction', 'admin-1')).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
