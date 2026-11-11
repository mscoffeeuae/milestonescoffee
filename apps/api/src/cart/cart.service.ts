/**
 * CartService — CRUD and version management for carts and cart items.
 *
 * Concurrency: Cart has a `version` column. All mutating operations use
 * optimistic concurrency (WHERE id=? AND version=?) to prevent lost updates
 * when two tabs modify the same cart simultaneously.
 *
 * Cart expiry: Guest carts expire after CART_TTL_HOURS. The worker sweeps
 * expired carts (Prompt 8). Cart items reference BranchProduct — if a product
 * is unavailable at checkout the quote will reject it.
 *
 * Token hashing: Guest tokens are stored as SHA-256 digests (hex). The raw
 * token is returned to the client once at cart creation; subsequent requests
 * hash the provided token before lookup. This means we never store a credential.
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import type { CartPriceQuote, PriceLineInput } from '../pricing/pricing.service.js';

export const CART_TTL_HOURS = 24;

export interface CartDto {
  id: string;
  branchId: string | null;
  version: number;
  expiresAt: Date;
  items: CartItemDto[];
  /** Quote is included when the cart has items and a branch is selected. */
  quote?: CartPriceQuote | undefined;
}

export interface CartItemDto {
  id: string;
  variantId: string;
  quantity: number;
  modifierOptionIds: string[];
}

export interface AddItemInput {
  variantId: string;
  quantity: number;
  modifierOptionIds?: string[] | undefined;
}

/** Hash a raw guest token to the stored digest. */
function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class CartService {
  constructor(
    private readonly db: DatabaseService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Create a new guest cart.
   * Returns the cart record and the plaintext token (shown ONCE — not stored).
   */
  async createGuestCart(branchId?: string): Promise<{ cart: CartDto; guestToken: string }> {
    // 32 bytes = 64 hex chars — sufficient entropy for a guest session token
    const { randomBytes } = await import('node:crypto');
    const guestToken = randomBytes(32).toString('hex');
    const guestTokenHash = hashToken(guestToken);

    const expiresAt = new Date(Date.now() + CART_TTL_HOURS * 60 * 60 * 1000);

    const cart = await this.db.client.cart.create({
      data: {
        guestTokenHash,
        branchId: branchId ?? null,
        expiresAt,
        version: 0,
      },
      select: { id: true, branchId: true, version: true, expiresAt: true },
    });

    return {
      cart: { ...cart, items: [] },
      guestToken, // ← returned to client once; never stored plain-text
    };
  }

  /** Find a cart by guest token (hashes the provided token before lookup). */
  async findByGuestToken(rawToken: string): Promise<CartDto> {
    const hash = hashToken(rawToken);
    return this.findAndEnrich({ guestTokenHash: hash });
  }

  /** Find a cart by customer ID (most recent non-expired). */
  async findByCustomer(customerId: string): Promise<CartDto> {
    return this.findAndEnrich({ customerId });
  }

  /** Find by cart ID directly (used internally or by authenticated customers). */
  async findById(cartId: string): Promise<CartDto> {
    return this.findAndEnrich({ id: cartId });
  }

  /** Add or increment a line item. Validates modifiers via PricingService. */
  async addItem(cartId: string, currentVersion: number, input: AddItemInput): Promise<CartDto> {
    if (input.quantity < 1) {
      throw new BadRequestException('Quantity must be ≥ 1');
    }

    const cart = await this.db.client.cart.findUnique({
      where: { id: cartId },
      select: { id: true, version: true, branchId: true, expiresAt: true },
    });
    if (!cart || cart.expiresAt < new Date()) {
      throw new NotFoundException(`Cart ${cartId} not found or expired`);
    }
    if (cart.version !== currentVersion) {
      throw new ConflictException(
        `Cart version mismatch: expected ${currentVersion}, found ${cart.version}`,
      );
    }

    const optionIds = input.modifierOptionIds ?? [];

    // Validate modifiers before writing (throws on invalid options)
    if (cart.branchId && optionIds.length > 0) {
      await this.pricingService.priceLine(cart.branchId, {
        variantId: input.variantId,
        quantity: input.quantity,
        modifierOptionIds: optionIds,
      });
    }

    // Upsert item + modifiers in a transaction with optimistic version bump
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.db.client.$transaction(async (tx: any) => {
      // Bump version with optimistic lock
      const updated = await tx.cart.updateMany({
        where: { id: cartId, version: currentVersion },
        data: { version: { increment: 1 } },
      });
      if (updated.count === 0) {
        throw new ConflictException('Cart was modified by another request');
      }

      // Check if this variant is already in the cart
      const existing = await tx.cartItem.findFirst({
        where: { cartId, variantId: input.variantId },
        select: { id: true },
      });

      if (existing) {
        // Increment quantity
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: { increment: input.quantity } },
        });
      } else {
        const item = await tx.cartItem.create({
          data: { cartId, variantId: input.variantId, quantity: input.quantity },
          select: { id: true },
        });
        if (optionIds.length > 0) {
          await tx.cartItemModifier.createMany({
            data: optionIds.map((optionId) => ({ itemId: item.id, optionId, quantity: 1 })),
          });
        }
      }
    });

    return this.findById(cartId);
  }

  /** Update the quantity of a cart item (set, not increment). */
  async updateItem(
    cartId: string,
    itemId: string,
    currentVersion: number,
    quantity: number,
  ): Promise<CartDto> {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be ≥ 1 — use removeItem to delete');
    }

    const updated = await this.db.client.cart.updateMany({
      where: { id: cartId, version: currentVersion },
      data: { version: { increment: 1 } },
    });
    if (updated.count === 0) {
      throw new ConflictException(`Cart ${cartId} not found or version mismatch`);
    }

    await this.db.client.cartItem.updateMany({
      where: { id: itemId, cartId },
      data: { quantity },
    });

    return this.findById(cartId);
  }

  /** Remove a cart item and its modifiers. */
  async removeItem(cartId: string, itemId: string, currentVersion: number): Promise<CartDto> {
    const updated = await this.db.client.cart.updateMany({
      where: { id: cartId, version: currentVersion },
      data: { version: { increment: 1 } },
    });
    if (updated.count === 0) {
      throw new ConflictException(`Cart ${cartId} not found or version mismatch`);
    }

    await this.db.client.$transaction([
      this.db.client.cartItemModifier.deleteMany({ where: { itemId } }),
      this.db.client.cartItem.delete({ where: { id: itemId } }),
    ]);

    return this.findById(cartId);
  }

  /** Set or change the branch for a cart. */
  async setBranch(cartId: string, branchId: string, currentVersion: number): Promise<CartDto> {
    const updated = await this.db.client.cart.updateMany({
      where: { id: cartId, version: currentVersion },
      data: { branchId, version: { increment: 1 } },
    });
    if (updated.count === 0) {
      throw new ConflictException(`Cart ${cartId} not found or version mismatch`);
    }
    return this.findById(cartId);
  }

  // ── private helpers ─────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async findAndEnrich(where: any): Promise<CartDto> {
    const cart = await this.db.client.cart.findFirst({
      where: { ...where, expiresAt: { gte: new Date() } },
      select: {
        id: true,
        branchId: true,
        version: true,
        expiresAt: true,
        items: {
          select: {
            id: true,
            variantId: true,
            quantity: true,
            modifiers: { select: { optionId: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!cart) throw new NotFoundException('Cart not found or expired');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: CartItemDto[] = cart.items.map((item: any) => ({
      id: item.id as string,
      variantId: item.variantId as string,
      quantity: item.quantity as number,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modifierOptionIds: item.modifiers.map((m: any) => m.optionId as string),
    }));

    let quote: CartPriceQuote | undefined;
    if (cart.branchId && items.length > 0) {
      try {
        const priceInputs: PriceLineInput[] = items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          modifierOptionIds: item.modifierOptionIds,
        }));
        quote = await this.pricingService.quoteCart(cart.branchId, priceInputs);
      } catch {
        // If pricing fails (e.g. variant no longer available), return cart without quote
        quote = undefined;
      }
    }

    return {
      id: cart.id,
      branchId: cart.branchId,
      version: cart.version,
      expiresAt: cart.expiresAt,
      items,
      quote,
    };
  }
}
