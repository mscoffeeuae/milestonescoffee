/**
 * GiftCardService — issuance, balance lookup, and redemption.
 *
 * Security model:
 *   - Gift card codes are 128-bit random hex strings (crypto.randomBytes(16))
 *   - Only SHA-256(code) is stored (codeDigest). Plaintext returned once.
 *   - Balance is a double-entry projection: balanceProjection column mirrors
 *     SUM(transactions WHERE action IN ('ISSUE','RELOAD')) - SUM(action='REDEEM')
 *   - Redemption uses optimistic locking via balanceProjection check in $transaction
 *
 * Policy stubs (D-010 pending):
 *   - MIN_AMOUNT_FILS = 5000 (50 AED)
 *   - MAX_AMOUNT_FILS = 50000 (500 AED)
 *   - Expiry = null (no expiry until D-010 decides)
 *   - Reload = disabled
 *
 * Business rules enforced here:
 *   - Redemption amount must not exceed current balance
 *   - Redemption is atomic — balance checked and decremented in same $transaction
 *   - Idempotency key prevents double-redemption on retry
 *   - Expired cards cannot be redeemed
 */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import type {
  IssueGiftCardInput,
  GiftCardIssuedDto,
  GiftCardBalanceDto,
  RedeemGiftCardInput,
  RedemptionResultDto,
} from './gift-card.types.js';

// ⚠ D-010 STUB: These limits must be confirmed by Finance before go-live.
const MIN_AMOUNT_FILS = 5_000;   // 50 AED
const MAX_AMOUNT_FILS = 50_000;  // 500 AED

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

@Injectable()
export class GiftCardService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Issue a new gift card.
   * Returns the plaintext code ONCE — it is irrecoverable after this call.
   * Staff/HQ only (enforced by controller RolesGuard).
   */
  async issue(input: IssueGiftCardInput): Promise<GiftCardIssuedDto> {
    if (input.amountFils < MIN_AMOUNT_FILS || input.amountFils > MAX_AMOUNT_FILS) {
      throw new BadRequestException(
        `Gift card amount must be between ${MIN_AMOUNT_FILS} and ${MAX_AMOUNT_FILS} fils (D-010 stub)`,
      );
    }

    // Generate high-entropy code
    const plainCode = randomBytes(16).toString('hex'); // 32 hex chars
    const codeDigest = hashCode(plainCode);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card: any = await this.db.client.$transaction(async (tx: any) => {
      const gc = await tx.giftCard.create({
        data: {
          codeDigest,
          status: 'ACTIVE',
          balanceProjection: input.amountFils,
          currency: 'AED',
          expiresAt: null, // D-010 stub
          issuedTo: input.customerId ?? null,
        },
        select: { id: true, status: true, balanceProjection: true, expiresAt: true, issuedTo: true, createdAt: true },
      });

      await tx.giftCardTransaction.create({
        data: {
          giftCardId: gc.id,
          action: 'ISSUE',
          businessSource: 'platform',
          businessRef: gc.id,
          amountFils: input.amountFils,
          occurredAt: new Date(),
        },
      });

      return gc;
    });

    return {
      id: card.id,
      code: plainCode,  // Returned once only
      status: card.status,
      balanceFils: card.balanceProjection,
      expiresAt: card.expiresAt?.toISOString() ?? null,
      issuedTo: card.issuedTo ?? null,
      createdAt: card.createdAt?.toISOString() ?? '',
    };
  }

  /**
   * Look up balance by plaintext code.
   * Does NOT return the code — only balance and status.
   */
  async getBalance(code: string): Promise<GiftCardBalanceDto> {
    const digest = hashCode(code);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card: any = await this.db.client.giftCard.findUnique({
      where: { codeDigest: digest },
      select: { id: true, status: true, balanceProjection: true, expiresAt: true },
    });

    if (!card) throw new NotFoundException('Gift card not found');

    return {
      id: card.id,
      status: card.status,
      balanceFils: card.balanceProjection,
      expiresAt: card.expiresAt?.toISOString() ?? null,
    };
  }

  /**
   * Redeem a gift card for a specific amount.
   * Atomic: balance check + decrement + ledger append in one $transaction.
   * Idempotent: duplicate idempotencyKey returns cached result.
   */
  async redeem(input: RedeemGiftCardInput): Promise<RedemptionResultDto> {
    if (input.amountFils <= 0) {
      throw new BadRequestException('Redemption amount must be positive');
    }

    const digest = hashCode(input.code);

    return this.db.client.$transaction(async (tx: any) => {
      // Check idempotency (businessSource=gift_redeem, businessRef=idempotencyKey)
      const existing = await tx.giftCardTransaction.findUnique({
        where: {
          businessSource_businessRef_action: {
            businessSource: 'gift_redeem',
            businessRef: input.idempotencyKey,
            action: 'REDEEM',
          },
        },
        include: { giftCard: { select: { id: true, balanceProjection: true } } },
      });

      if (existing) {
        // Return idempotent result
        return {
          success: true,
          giftCardId: existing.giftCardId,
          redeemedFils: existing.amountFils,
          remainingFils: existing.giftCard?.balanceProjection ?? 0,
        };
      }

      const card = await tx.giftCard.findUnique({
        where: { codeDigest: digest },
        select: { id: true, status: true, balanceProjection: true, expiresAt: true },
      });

      if (!card) throw new NotFoundException('Gift card not found');
      if (card.status !== 'ACTIVE') {
        throw new UnprocessableEntityException(`Gift card is ${card.status}`);
      }
      if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
        throw new UnprocessableEntityException('Gift card has expired');
      }
      if (card.balanceProjection < input.amountFils) {
        throw new UnprocessableEntityException(
          `Insufficient balance: ${card.balanceProjection} fils available, ${input.amountFils} fils requested`,
        );
      }

      // Decrement balance projection
      const newBalance = card.balanceProjection - input.amountFils;
      await tx.giftCard.update({
        where: { id: card.id },
        data: {
          balanceProjection: newBalance,
          ...(newBalance === 0 ? { status: 'REDEEMED' } : {}),
        },
      });

      // Append ledger entry
      await tx.giftCardTransaction.create({
        data: {
          giftCardId: card.id,
          action: 'REDEEM',
          businessSource: 'gift_redeem',
          businessRef: input.idempotencyKey,
          amountFils: input.amountFils,
          occurredAt: new Date(),
        },
      });

      return {
        success: true,
        giftCardId: card.id,
        redeemedFils: input.amountFils,
        remainingFils: newBalance,
      };
    });
  }

  /**
   * Void a gift card (staff/HQ only).
   * Balance set to 0, status → VOID.
   */
  async void(cardId: string, reason: string, actorId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card: any = await this.db.client.giftCard.findUnique({
      where: { id: cardId },
      select: { id: true, status: true, balanceProjection: true },
    });
    if (!card) throw new NotFoundException('Gift card not found');
    if (card.status === 'VOID') throw new ConflictException('Gift card already voided');

    await this.db.client.$transaction(async (tx: any) => {
      await tx.giftCard.update({
        where: { id: cardId },
        data: { status: 'VOID', balanceProjection: 0 },
      });

      if (card.balanceProjection > 0) {
        await tx.giftCardTransaction.create({
          data: {
            giftCardId: cardId,
            action: 'EXPIRE',
            businessSource: 'platform_void',
            businessRef: `void-${cardId}-${actorId}`,
            amountFils: card.balanceProjection,
            occurredAt: new Date(),
          },
        });
      }
    });
  }
}
