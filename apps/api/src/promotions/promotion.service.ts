/**
 * PromotionService — coupon validation and discount computation.
 *
 * ⚠ D-009 STUB: Actual discount calculation requires business approval of:
 *   - Promotion rule schema (rulesJson structure)
 *   - Stackability policy (can promotions stack with loyalty?)
 *   - Maximum discount cap (% or absolute fils)
 *
 * Current behaviour:
 *   - validateCode: confirms code exists, is active, within validity window,
 *     and hasn't exceeded usageLimit. Returns promotion metadata.
 *   - applyPromotion: ALWAYS returns discountFils=0 (D-009 stub).
 *     Real rule evaluation goes here once rulesJson schema is approved.
 *   - PromotionRedemption.@@unique([orderId, promotionId]) prevents double-spend.
 *
 * rulesJson format (pending D-009 approval):
 *   The schema is intentionally unspecified. The service reads it as `unknown`
 *   and coerces zero discount until a type-safe evaluator is implemented.
 */
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface PromotionDto {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string | null;
  validFrom: string;
  validUntil: string | null;
  usageLimit: number | null;
  isActive: boolean;
}

export interface ApplyPromotionInput {
  promotionId: string;
  orderId: string;
  orderTotalFils: number;
  branchId: string;
  idempotencyKey: string;
}

export interface PromotionRedemptionDto {
  promotionId: string;
  orderId: string;
  discountFils: number;
  note: string;
}

@Injectable()
export class PromotionService {
  constructor(private readonly db: DatabaseService) {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** List active promotions for display (no-code promotions only). */
  async listActive(): Promise<PromotionDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promotions: any[] = await this.db.client.promotion.findMany({
      where: {
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
        code: null, // Only show auto-applied promotions (not coupon codes)
      },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        code: true,
        validFrom: true,
        validUntil: true,
        usageLimit: true,
        isActive: true,
      },
      orderBy: { validFrom: 'desc' },
    }) ?? [];

    return promotions.map(this.mapPromotion);
  }

  /** Validate a coupon code. Returns promotion metadata without applying it. */
  async validateCode(code: string): Promise<PromotionDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promotion: any = await this.db.client.promotion.findFirst({
      where: { code, isActive: true },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        code: true,
        validFrom: true,
        validUntil: true,
        usageLimit: true,
        isActive: true,
        _count: { select: { promotionRedemptions: true } },
      },
    });

    if (!promotion) throw new NotFoundException('Promotion code not found or inactive');

    const now = new Date();
    if (new Date(promotion.validFrom) > now) {
      throw new UnprocessableEntityException('Promotion has not started yet');
    }
    if (promotion.validUntil && new Date(promotion.validUntil) < now) {
      throw new UnprocessableEntityException('Promotion has expired');
    }
    if (
      promotion.usageLimit !== null &&
      promotion._count.promotionRedemptions >= promotion.usageLimit
    ) {
      throw new UnprocessableEntityException('Promotion usage limit reached');
    }

    return this.mapPromotion(promotion);
  }

  /**
   * Apply a promotion to an order.
   * Idempotent — duplicate calls for same (orderId, promotionId) are safe.
   *
   * ⚠ D-009 STUB: discountFils is always 0 until rule evaluator is implemented.
   */
  async applyPromotion(input: ApplyPromotionInput): Promise<PromotionRedemptionDto> {
    // Validate promotion exists and is applicable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promotion: any = await this.db.client.promotion.findUnique({
      where: { id: input.promotionId },
      select: {
        id: true,
        nameEn: true,
        isActive: true,
        validFrom: true,
        validUntil: true,
        usageLimit: true,
        rulesJson: true,
        _count: { select: { promotionRedemptions: true } },
      },
    });

    if (!promotion) throw new NotFoundException('Promotion not found');
    if (!promotion.isActive) throw new UnprocessableEntityException('Promotion is not active');

    const now = new Date();
    if (new Date(promotion.validFrom) > now) {
      throw new UnprocessableEntityException('Promotion has not started yet');
    }
    if (promotion.validUntil && new Date(promotion.validUntil) < now) {
      throw new UnprocessableEntityException('Promotion has expired');
    }
    if (
      promotion.usageLimit !== null &&
      promotion._count.promotionRedemptions >= promotion.usageLimit
    ) {
      throw new UnprocessableEntityException('Promotion usage limit reached');
    }

    // ⚠ D-009 STUB: rule evaluation not implemented
    // TODO: implement when rulesJson schema is approved by Finance+Marketing
    // const discountFils = evaluateRules(promotion.rulesJson, input.orderTotalFils, input.branchId);
    const discountFils = 0;

    // Idempotency: @@unique([orderId, promotionId])
    const existing = await (this.db.client.promotionRedemption as any).findUnique({
      where: {
        orderId_promotionId: { orderId: input.orderId, promotionId: input.promotionId },
      },
      select: { promotionId: true, orderId: true, discountFils: true },
    });

    if (existing) {
      return {
        promotionId: existing.promotionId,
        orderId: existing.orderId,
        discountFils: existing.discountFils,
        note: 'Idempotent — promotion already applied to this order',
      };
    }

    // Check promotion hasn't been applied to THIS order already with a different redemption record
    // (should be caught by unique index, but extra safety)
    return this.db.client.$transaction(async (tx: any) => {
      let record: any;
      try {
        record = await tx.promotionRedemption.create({
          data: {
            promotionId: input.promotionId,
            orderId: input.orderId,
            discountFils,
          },
          select: { promotionId: true, orderId: true, discountFils: true },
        });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          // Unique constraint violation — concurrent request won the race
          throw new ConflictException('Promotion already applied to this order');
        }
        throw err;
      }

      return {
        promotionId: record.promotionId,
        orderId: record.orderId,
        discountFils: record.discountFils,
        note: 'D-009 stub: discount=0 fils pending rule implementation',
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  /** Admin: list all promotions (including inactive). */
  async adminListAll(): Promise<PromotionDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promotions: any[] = await this.db.client.promotion.findMany({
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        code: true,
        validFrom: true,
        validUntil: true,
        usageLimit: true,
        isActive: true,
      },
      orderBy: { validFrom: 'desc' },
    }) ?? [];

    return promotions.map(this.mapPromotion);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private mapPromotion(p: any): PromotionDto {
    return {
      id: p.id,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      code: p.code ?? null,
      validFrom: p.validFrom instanceof Date ? p.validFrom.toISOString() : (p.validFrom ?? ''),
      validUntil: p.validUntil
        ? (p.validUntil instanceof Date ? p.validUntil.toISOString() : p.validUntil)
        : null,
      usageLimit: p.usageLimit ?? null,
      isActive: p.isActive,
    };
  }
}
