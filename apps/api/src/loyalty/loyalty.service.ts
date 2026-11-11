/**
 * LoyaltyService — points earn, redemption, and balance management.
 *
 * Policy constraints are VERSION-CONTROLLED via LoyaltyRule records.
 * The active rule version is read from DB; earn rates and expiry
 * are stored in earnRateJson and expiryDays.
 *
 * ⚠ D-009 STUB: LoyaltyRule policies have NOT been approved by Finance +
 * Marketing. The earn rate used here (1 point per 100 fils = 1 AED) is a
 * PLACEHOLDER. Do not use for production until D-009 is resolved.
 *
 * Double-entry ledger:
 *   - Every earn/spend appends a LoyaltyTransaction row
 *   - balanceProjection is maintained as a running total (denormalized for
 *     fast reads); authoritative figure = SUM(points) across transactions
 *   - Idempotency: (businessSource, businessRef, action) is UNIQUE
 *
 * Redemption lifecycle:
 *   RESERVED → COMMITTED (on order completion)
 *   RESERVED → REVERSED (on order cancellation)
 *
 * Concurrency:
 *   - Redemption reads and decrements balanceProjection in $transaction
 *   - If concurrent requests race, the UNIQUE constraint on
 *     LoyaltyTransaction prevents double-earn; the balance check prevents
 *     overdraft for redemption
 */
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

// ⚠ D-009 STUB: 1 point per 100 fils (1 AED). Pending Finance+Marketing approval.
const D009_EARN_RATE_POINTS_PER_FILS = 1 / 100;

export interface LoyaltyBalanceDto {
  customerId: string;
  accountId: string;
  balancePoints: number;
  tier: string;
}

export interface EarnPointsInput {
  customerId: string;
  orderId: string;
  orderTotalFils: number;  // Amount eligible for earning (after discounts)
  idempotencyKey: string;
}

export interface ReserveRedemptionInput {
  customerId: string;
  rewardId: string;
  orderId?: string | undefined;
  idempotencyKey: string;
}

export interface RedemptionDto {
  id: string;
  status: string;
  rewardId: string;
  pointsSpent: number;
  orderId: string | null;
}

@Injectable()
export class LoyaltyService {
  constructor(private readonly db: DatabaseService) {}

  // ---------------------------------------------------------------------------
  // Account management
  // ---------------------------------------------------------------------------

  /** Get or create loyalty account for customer. */
  async getOrCreateAccount(customerId: string): Promise<LoyaltyBalanceDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let account: any = await this.db.client.loyaltyAccount.findUnique({
      where: { customerId },
      select: { id: true, customerId: true, balanceProjection: true, tier: true },
    });

    if (!account) {
      account = await (this.db.client.loyaltyAccount as any).create({
        data: { customerId, balanceProjection: 0, tier: 'STANDARD' },
        select: { id: true, customerId: true, balanceProjection: true, tier: true },
      });
    }

    return {
      customerId: account.customerId,
      accountId: account.id,
      balancePoints: account.balanceProjection,
      tier: account.tier,
    };
  }

  async getBalance(customerId: string): Promise<LoyaltyBalanceDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account: any = await this.db.client.loyaltyAccount.findUnique({
      where: { customerId },
      select: { id: true, customerId: true, balanceProjection: true, tier: true },
    });

    if (!account) throw new NotFoundException('Loyalty account not found');

    return {
      customerId: account.customerId,
      accountId: account.id,
      balancePoints: account.balanceProjection,
      tier: account.tier,
    };
  }

  // ---------------------------------------------------------------------------
  // Earn
  // ---------------------------------------------------------------------------

  /**
   * Earn points for a completed order.
   * Idempotent — duplicate calls for same orderId return existing points.
   * Called by OrderService on COMPLETED transition (or via worker).
   */
  async earnForOrder(input: EarnPointsInput): Promise<{ pointsEarned: number }> {
    if (input.orderTotalFils <= 0) return { pointsEarned: 0 };

    // ⚠ D-009 STUB: flat rate, no tier multiplier
    const pointsEarned = Math.floor(input.orderTotalFils * D009_EARN_RATE_POINTS_PER_FILS);
    if (pointsEarned === 0) return { pointsEarned: 0 };

    return this.db.client.$transaction(async (tx: any) => {
      // Check idempotency
      const existing = await tx.loyaltyTransaction.findUnique({
        where: {
          businessSource_businessRef_action: {
            businessSource: 'ORDER',
            businessRef: input.orderId,
            action: 'EARN',
          },
        },
        select: { points: true },
      });
      if (existing) return { pointsEarned: existing.points };

      // Upsert loyalty account
      let account = await tx.loyaltyAccount.findUnique({
        where: { customerId: input.customerId },
        select: { id: true, balanceProjection: true },
      });
      if (!account) {
        account = await tx.loyaltyAccount.create({
          data: { customerId: input.customerId, balanceProjection: 0, tier: 'STANDARD' },
          select: { id: true, balanceProjection: true },
        });
      }

      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { balanceProjection: { increment: pointsEarned } },
      });

      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          action: 'EARN',
          businessSource: 'ORDER',
          businessRef: input.orderId,
          points: pointsEarned,
          note: `D-009 stub earn: ${pointsEarned} pts for order ${input.orderId}`,
          occurredAt: new Date(),
        },
      });

      return { pointsEarned };
    });
  }

  // ---------------------------------------------------------------------------
  // Redemption
  // ---------------------------------------------------------------------------

  /** Reserve points for a reward (before order confirmed). */
  async reserveRedemption(input: ReserveRedemptionInput): Promise<RedemptionDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reward: any = await this.db.client.reward.findUnique({
      where: { id: input.rewardId },
      select: { id: true, nameEn: true, pointsCost: true, isActive: true, validUntil: true },
    });

    if (!reward) throw new NotFoundException('Reward not found');
    if (!reward.isActive) throw new UnprocessableEntityException('Reward is not active');
    if (reward.validUntil && new Date(reward.validUntil) < new Date()) {
      throw new UnprocessableEntityException('Reward has expired');
    }

    return this.db.client.$transaction(async (tx: any) => {
      // Idempotency check
      const existing = await tx.redemption.findFirst({
        where: { loyaltyAccount: { customerId: input.customerId }, rewardId: input.rewardId, orderId: input.orderId ?? null },
        select: { id: true, status: true, rewardId: true, pointsSpent: true, orderId: true },
      });
      if (existing) return { id: existing.id, status: existing.status, rewardId: existing.rewardId, pointsSpent: existing.pointsSpent, orderId: existing.orderId ?? null };

      const account = await tx.loyaltyAccount.findUnique({
        where: { customerId: input.customerId },
        select: { id: true, balanceProjection: true },
      });
      if (!account) throw new NotFoundException('Loyalty account not found');
      if (account.balanceProjection < reward.pointsCost) {
        throw new UnprocessableEntityException(
          `Insufficient points: ${account.balanceProjection} available, ${reward.pointsCost} required`,
        );
      }

      // Reserve (decrement projection)
      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { balanceProjection: { decrement: reward.pointsCost } },
      });

      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          action: 'REDEEM',
          businessSource: 'REWARD',
          businessRef: `${input.rewardId}-${input.idempotencyKey}`,
          points: -reward.pointsCost,
          note: `Reserved for reward ${reward.nameEn}`,
          occurredAt: new Date(),
        },
      });

      const redemption = await tx.redemption.create({
        data: {
          loyaltyAccountId: account.id,
          rewardId: input.rewardId,
          orderId: input.orderId ?? null,
          pointsSpent: reward.pointsCost,
          status: 'RESERVED',
        },
        select: { id: true, status: true, rewardId: true, pointsSpent: true, orderId: true },
      });

      return { id: redemption.id, status: redemption.status, rewardId: redemption.rewardId, pointsSpent: redemption.pointsSpent, orderId: redemption.orderId ?? null };
    });
  }

  /** Commit a RESERVED redemption (order confirmed). */
  async commitRedemption(redemptionId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const redemption: any = await this.db.client.redemption.findUnique({
      where: { id: redemptionId },
      select: { id: true, status: true },
    });
    if (!redemption) throw new NotFoundException('Redemption not found');
    if (redemption.status !== 'RESERVED') {
      throw new UnprocessableEntityException(`Redemption is ${redemption.status}, cannot commit`);
    }
    await (this.db.client.redemption as any).update({
      where: { id: redemptionId },
      data: { status: 'COMMITTED' },
    });
  }

  /** Reverse a RESERVED redemption (order cancelled). Restores balance. */
  async reverseRedemption(redemptionId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const redemption: any = await this.db.client.redemption.findUnique({
      where: { id: redemptionId },
      select: { id: true, status: true, loyaltyAccountId: true, pointsSpent: true },
    });
    if (!redemption) throw new NotFoundException('Redemption not found');
    if (redemption.status !== 'RESERVED') {
      throw new UnprocessableEntityException(`Redemption is ${redemption.status}, cannot reverse`);
    }

    await this.db.client.$transaction(async (tx: any) => {
      await tx.redemption.update({ where: { id: redemptionId }, data: { status: 'REVERSED' } });
      await tx.loyaltyAccount.update({
        where: { id: redemption.loyaltyAccountId },
        data: { balanceProjection: { increment: redemption.pointsSpent } },
      });
      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: redemption.loyaltyAccountId,
          action: 'ADJUST',
          businessSource: 'REDEMPTION_REVERSE',
          businessRef: redemptionId,
          points: redemption.pointsSpent,
          note: `Reversal of redemption ${redemptionId}`,
          occurredAt: new Date(),
        },
      });
    });
  }

  /** List available active rewards. */
  async listRewards(): Promise<unknown[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rewards: any[] = await this.db.client.reward.findMany({
      where: {
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
      select: { id: true, nameEn: true, nameAr: true, pointsCost: true, benefitJson: true },
      orderBy: { pointsCost: 'asc' },
    }) ?? [];
    return rewards;
  }

  /** Admin: adjust points (manual correction). */
  async adjustPoints(customerId: string, points: number, note: string, adminId: string): Promise<void> {
    if (points === 0) throw new BadRequestException('Adjustment points cannot be zero');

    await this.db.client.$transaction(async (tx: any) => {
      const account = await tx.loyaltyAccount.findUnique({
        where: { customerId },
        select: { id: true, balanceProjection: true },
      });
      if (!account) throw new NotFoundException('Loyalty account not found');

      const newBalance = account.balanceProjection + points;
      if (newBalance < 0) throw new UnprocessableEntityException('Adjustment would result in negative balance');

      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { balanceProjection: newBalance },
      });

      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          action: 'ADJUST',
          businessSource: 'MANUAL',
          businessRef: `adj-${adminId}-${Date.now()}`,
          points,
          note,
          occurredAt: new Date(),
        },
      });
    });
  }
}
