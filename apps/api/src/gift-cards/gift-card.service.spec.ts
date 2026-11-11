/**
 * GiftCardService unit tests.
 * Direct instantiation pattern (Vitest ESM DI issue).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GiftCardService } from './gift-card.service.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGiftCard(partial: Record<string, unknown> = {}) {
  return {
    id: 'gc-1',
    codeDigest: 'somedigest',
    status: 'ACTIVE',
    balanceProjection: 10_000, // 100 AED
    currency: 'AED',
    expiresAt: null,
    issuedTo: null,
    createdAt: new Date(),
    ...partial,
  };
}

function makeDb() {
  const txFn = vi.fn();
  return {
    client: {
      giftCard: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
      },
      giftCardTransaction: {
        create: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
        const tx = {
          giftCard: {
            create: vi.fn().mockResolvedValue(makeGiftCard()),
            findUnique: vi.fn().mockResolvedValue(makeGiftCard()),
            update: vi.fn().mockResolvedValue(makeGiftCard()),
          },
          giftCardTransaction: {
            create: vi.fn().mockResolvedValue({}),
            findUnique: vi.fn().mockResolvedValue(null),
          },
        };
        txFn(tx);
        return fn(tx);
      }),
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GiftCardService', () => {
  let service: GiftCardService;
  let db: ReturnType<typeof makeDb>;

  beforeEach(() => {
    db = makeDb();
    service = new GiftCardService(db as any);
  });

  // -------------------------------------------------------------------------
  // issue
  // -------------------------------------------------------------------------

  describe('issue', () => {
    it('rejects amount below minimum (5000 fils)', async () => {
      await expect(service.issue({ amountFils: 100 })).rejects.toThrow(BadRequestException);
    });

    it('rejects amount above maximum (50000 fils)', async () => {
      await expect(service.issue({ amountFils: 100_000 })).rejects.toThrow(BadRequestException);
    });

    it('issues card and returns plaintext code', async () => {
      const result = await service.issue({ amountFils: 10_000 });

      expect(result.code).toMatch(/^[0-9a-f]{32}$/); // 128-bit hex
      expect(result.status).toBe('ACTIVE');
      expect(result.balanceFils).toBe(10_000);
    });
  });

  // -------------------------------------------------------------------------
  // getBalance
  // -------------------------------------------------------------------------

  describe('getBalance', () => {
    it('throws NotFoundException for unknown code', async () => {
      db.client.giftCard.findUnique.mockResolvedValue(null);
      await expect(service.getBalance('badcode')).rejects.toThrow(NotFoundException);
    });

    it('returns balance for valid code', async () => {
      db.client.giftCard.findUnique.mockResolvedValue(makeGiftCard());

      const result = await service.getBalance('validcode');

      expect(result.balanceFils).toBe(10_000);
      expect(result.status).toBe('ACTIVE');
    });
  });

  // -------------------------------------------------------------------------
  // redeem
  // -------------------------------------------------------------------------

  describe('redeem', () => {
    it('rejects negative amount', async () => {
      await expect(
        service.redeem({ code: 'code', amountFils: -1, idempotencyKey: 'key-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects redemption exceeding balance', async () => {
      db.client.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          giftCard: {
            findUnique: vi.fn().mockResolvedValue(makeGiftCard({ balanceProjection: 1_000 })),
            update: vi.fn(),
          },
          giftCardTransaction: {
            create: vi.fn(),
            findUnique: vi.fn().mockResolvedValue(null),
          },
        };
        return fn(tx);
      });

      await expect(
        service.redeem({ code: 'code', amountFils: 2_000, idempotencyKey: 'key-2' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects VOID card', async () => {
      db.client.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          giftCard: {
            findUnique: vi.fn().mockResolvedValue(makeGiftCard({ status: 'VOID' })),
            update: vi.fn(),
          },
          giftCardTransaction: {
            create: vi.fn(),
            findUnique: vi.fn().mockResolvedValue(null),
          },
        };
        return fn(tx);
      });

      await expect(
        service.redeem({ code: 'code', amountFils: 100, idempotencyKey: 'key-3' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('returns idempotent result on duplicate key', async () => {
      const existingTx = {
        giftCardId: 'gc-1',
        amountFils: 500,
        giftCard: { id: 'gc-1', balanceProjection: 9_500 },
      };
      db.client.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          giftCard: { findUnique: vi.fn().mockResolvedValue(makeGiftCard()) },
          giftCardTransaction: {
            findUnique: vi.fn().mockResolvedValue(existingTx),
            create: vi.fn(),
          },
        };
        return fn(tx);
      });

      const result = await service.redeem({ code: 'code', amountFils: 500, idempotencyKey: 'dup-key' });

      expect(result.redeemedFils).toBe(500);
      expect(result.remainingFils).toBe(9_500);
    });
  });

  // -------------------------------------------------------------------------
  // void
  // -------------------------------------------------------------------------

  describe('void', () => {
    it('throws NotFoundException for unknown card', async () => {
      db.client.giftCard.findUnique.mockResolvedValue(null);

      await expect(service.void('gc-nonexistent', 'reason', 'staff-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException if already voided', async () => {
      db.client.giftCard.findUnique.mockResolvedValue(makeGiftCard({ status: 'VOID' }));

      await expect(service.void('gc-1', 'reason', 'staff-1')).rejects.toThrow(ConflictException);
    });
  });
});
