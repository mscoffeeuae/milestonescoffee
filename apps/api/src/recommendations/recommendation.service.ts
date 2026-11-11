/**
 * Recommendation service — simple collaborative/behavioural recommendations.
 *
 * Strategy (Phase 3 baseline):
 *   1. Record behavioural events (view, add-to-cart, purchase, skip).
 *   2. For a given customer, return top products by weighted event score
 *      from OTHER customers who share purchase history (item-based CF).
 *
 * ⚠ D-013 STUB: The collaborative filtering algorithm is deferred.
 *   Current implementation returns "popular items at this branch" based on
 *   PURCHASE event counts. Full CF requires a background job that builds
 *   a co-occurrence matrix — pending Data + Engineering approval of the
 *   compute budget.
 *
 * Feature gate: 'recommendations' flag must be enabled per branch.
 * Events are always recorded (regardless of flag) to build history
 * before the flag is turned on.
 */
import { Injectable, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service.js';
import { RecommendationEventType } from '@milestones/database';

export interface RecordEventInput {
  customerId: string;
  productId: string;
  branchId?: string | undefined;
  eventType: RecommendationEventType;
}

export interface RecommendationEventDto {
  id: string;
  customerId: string;
  productId: string;
  branchId: string | null;
  eventType: RecommendationEventType;
  occurredAt: Date;
}

export interface RecommendedProduct {
  productId: string;
  score: number;    // Higher = more recommended
  reason: string;   // Human-readable signal label
}

/** Weights applied to event types for popularity scoring (⚠ D-013 STUB values). */
const EVENT_WEIGHTS: Record<RecommendationEventType, number> = {
  PURCHASE: 10,
  ADD_TO_CART: 3,
  VIEW: 1,
  SKIP: -5,  // Negative weight for explicit skips
};

@Injectable()
export class RecommendationService {
  constructor(
    private readonly db: DatabaseService,
    private readonly flags: FeatureFlagsService,
  ) {}

  /**
   * Record a behavioural event.
   * Always allowed regardless of feature flag (builds history early).
   */
  async recordEvent(input: RecordEventInput): Promise<RecommendationEventDto> {
    const record = await this.db.client.recommendationEvent.create({
      data: {
        customerId: input.customerId,
        productId: input.productId,
        branchId: input.branchId ?? null,
        eventType: input.eventType,
      },
    });

    return {
      id: record.id,
      customerId: record.customerId,
      productId: record.productId,
      branchId: record.branchId ?? null,
      eventType: record.eventType as RecommendationEventType,
      occurredAt: record.occurredAt,
    };
  }

  /**
   * Get recommendations for a customer at a branch.
   *
   * ⚠ D-013 STUB: Returns branch-popular products excluding items the
   * customer has already purchased recently.
   * Full collaborative filtering is deferred.
   *
   * Requires 'recommendations' feature flag for the branch.
   */
  async getRecommendations(
    customerId: string,
    branchId: string,
    limit = 10,
  ): Promise<RecommendedProduct[]> {
    const enabled = await this.flags.isEnabled(branchId, 'recommendations');
    if (!enabled) {
      throw new ForbiddenException(
        `Recommendations are not enabled for branch ${branchId}`,
      );
    }

    // Find products the customer has already purchased (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const customerPurchases = await this.db.client.recommendationEvent.findMany({
      where: {
        customerId,
        eventType: RecommendationEventType.PURCHASE,
        occurredAt: { gte: ninetyDaysAgo },
      },
      select: { productId: true },
    });
    const alreadyBought = new Set(customerPurchases.map((e: { productId: string }) => e.productId));

    // Find products the customer has explicitly skipped
    const skippedEvents = await this.db.client.recommendationEvent.findMany({
      where: { customerId, eventType: RecommendationEventType.SKIP },
      select: { productId: true },
    });
    const skipped = new Set(skippedEvents.map((e: { productId: string }) => e.productId));

    // ⚠ D-013 STUB: Aggregate weighted event scores across all customers at this branch
    // In a real CF system we'd compute co-occurrence and similarity scores server-side.
    const allEvents = await this.db.client.recommendationEvent.findMany({
      where: {
        branchId,
        occurredAt: { gte: ninetyDaysAgo },
      },
      select: { productId: true, eventType: true },
    });

    // Accumulate weighted scores per product
    const scores = new Map<string, number>();
    for (const event of allEvents) {
      const productId = event.productId as string;
      const weight = EVENT_WEIGHTS[event.eventType as RecommendationEventType] ?? 0;
      scores.set(productId, (scores.get(productId) ?? 0) + weight);
    }

    // Filter and rank
    const recommendations: RecommendedProduct[] = Array.from(scores.entries())
      .filter(([productId]) => !alreadyBought.has(productId) && !skipped.has(productId))
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([productId, score]) => ({
        productId,
        score,
        reason: 'popular_at_branch', // ⚠ D-013 STUB — real reasons from CF model
      }));

    return recommendations;
  }

  /**
   * Get recently viewed products for a customer (last 30 days).
   * No feature flag required — this is view history retrieval.
   */
  async getRecentlyViewed(customerId: string, limit = 10): Promise<string[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await this.db.client.recommendationEvent.findMany({
      where: {
        customerId,
        eventType: RecommendationEventType.VIEW,
        occurredAt: { gte: thirtyDaysAgo },
      },
      orderBy: { occurredAt: 'desc' },
      select: { productId: true },
    });

    // Deduplicate while preserving most-recent-first order
    const seen = new Set<string>();
    const result: string[] = [];
    for (const e of events) {
      if (!seen.has(e.productId)) {
        seen.add(e.productId);
        result.push(e.productId);
        if (result.length >= limit) break;
      }
    }
    return result;
  }
}
