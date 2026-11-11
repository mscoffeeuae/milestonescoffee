import { describe, it, expect, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { RecommendationService } from './recommendation.service.js';
import { RecommendationEventType } from '@milestones/database';

function makeDb(overrides: { recommendationEvent?: any } = {}) {
  return {
    client: {
      recommendationEvent: {
        create: vi.fn().mockResolvedValue({
          id: 'evt-1',
          customerId: 'cust-1',
          productId: 'prod-1',
          branchId: 'branch-1',
          eventType: RecommendationEventType.VIEW,
          occurredAt: new Date(),
        }),
        findMany: vi.fn().mockResolvedValue([]),
        ...(overrides['recommendationEvent'] ?? {}),
      },
    },
  } as any;
}

function makeFlags(recommendationsEnabled = true) {
  return {
    isEnabled: vi.fn().mockResolvedValue(recommendationsEnabled),
  } as any;
}

describe('RecommendationService', () => {
  describe('recordEvent', () => {
    it('creates an event record', async () => {
      const db = makeDb();
      const flags = makeFlags();
      const svc = new RecommendationService(db, flags);
      const result = await svc.recordEvent({
        customerId: 'cust-1',
        productId: 'prod-1',
        branchId: 'branch-1',
        eventType: RecommendationEventType.VIEW,
      });
      expect(result.id).toBe('evt-1');
      expect(db.client.recommendationEvent.create).toHaveBeenCalledOnce();
    });

    it('records event even when recommendations flag is disabled', async () => {
      const db = makeDb();
      const flags = makeFlags(false); // flag disabled
      const svc = new RecommendationService(db, flags);
      // Should NOT throw ForbiddenException
      await expect(
        svc.recordEvent({
          customerId: 'cust-1',
          productId: 'prod-1',
          eventType: RecommendationEventType.PURCHASE,
        }),
      ).resolves.toBeDefined();
      // isEnabled should NOT be called for event recording
      expect(flags.isEnabled).not.toHaveBeenCalled();
    });
  });

  describe('getRecommendations', () => {
    it('throws ForbiddenException when flag disabled', async () => {
      const db = makeDb();
      const flags = makeFlags(false);
      const svc = new RecommendationService(db, flags);
      await expect(svc.getRecommendations('cust-1', 'branch-1')).rejects.toThrow(ForbiddenException);
    });

    it('returns empty list when no events exist', async () => {
      const db = makeDb();
      const flags = makeFlags(true);
      const svc = new RecommendationService(db, flags);
      const result = await svc.getRecommendations('cust-1', 'branch-1');
      expect(result).toEqual([]);
    });

    it('D-013 STUB: returns popular items by weighted score', async () => {
      // Customer has purchased prod-1; other customers have purchased prod-2 more
      const db = makeDb({
        recommendationEvent: {
          findMany: vi.fn()
            // First call: customer's purchases (already bought)
            .mockResolvedValueOnce([{ productId: 'prod-1' }])
            // Second call: customer's skips (none)
            .mockResolvedValueOnce([])
            // Third call: all branch events (popularity)
            .mockResolvedValueOnce([
              { productId: 'prod-2', eventType: RecommendationEventType.PURCHASE },
              { productId: 'prod-2', eventType: RecommendationEventType.PURCHASE },
              { productId: 'prod-3', eventType: RecommendationEventType.VIEW },
            ]),
        },
      });
      const flags = makeFlags(true);
      const svc = new RecommendationService(db, flags);
      const result = await svc.getRecommendations('cust-1', 'branch-1');
      // prod-1 excluded (already bought); prod-2 score=20, prod-3 score=1
      expect(result[0]?.productId).toBe('prod-2');
      expect(result[0]?.score).toBe(20);
      expect(result[1]?.productId).toBe('prod-3');
    });

    it('excludes skipped products', async () => {
      const db = makeDb({
        recommendationEvent: {
          findMany: vi.fn()
            .mockResolvedValueOnce([])                                              // purchases
            .mockResolvedValueOnce([{ productId: 'prod-2' }])                       // skips
            .mockResolvedValueOnce([
              { productId: 'prod-2', eventType: RecommendationEventType.PURCHASE }, // popular but skipped
              { productId: 'prod-3', eventType: RecommendationEventType.VIEW },
            ]),
        },
      });
      const flags = makeFlags(true);
      const svc = new RecommendationService(db, flags);
      const result = await svc.getRecommendations('cust-1', 'branch-1');
      expect(result.find((r) => r.productId === 'prod-2')).toBeUndefined();
    });
  });

  describe('getRecentlyViewed', () => {
    it('returns empty list when no views', async () => {
      const db = makeDb();
      const flags = makeFlags();
      const svc = new RecommendationService(db, flags);
      const result = await svc.getRecentlyViewed('cust-1');
      expect(result).toEqual([]);
    });

    it('deduplicates product IDs, keeping most-recent-first order', async () => {
      const db = makeDb({
        recommendationEvent: {
          findMany: vi.fn().mockResolvedValue([
            { productId: 'prod-A' },
            { productId: 'prod-B' },
            { productId: 'prod-A' }, // duplicate — should be skipped
            { productId: 'prod-C' },
          ]),
        },
      });
      const flags = makeFlags();
      const svc = new RecommendationService(db, flags);
      const result = await svc.getRecentlyViewed('cust-1');
      expect(result).toEqual(['prod-A', 'prod-B', 'prod-C']);
    });
  });
});
