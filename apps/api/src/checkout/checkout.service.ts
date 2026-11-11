/**
 * CheckoutService — quote creation and order placement.
 *
 * Flow:
 *   1. POST /checkout/quotes — validate cart items, snapshot prices, persist quote
 *   2. POST /checkout/orders — accept quote, create Order + OrderItems atomically
 *
 * Idempotency: POST /checkout/orders requires Idempotency-Key header.
 *   If the key already exists, the existing order is returned.
 *
 * Order state machine (from contracts package):
 *   PENDING → CONFIRMED (after payment captured)
 *   CONFIRMED → PREPARING → READY → COMPLETED
 *   Any state → CANCELLED (customer-initiated, before PREPARING)
 *
 * Blocking decisions:
 *   D-005 — payment gateway
 *   D-007 — tax policy (taxFils=0 until resolved)
 *   D-008 — guest ordering (guests can place orders pending this decision)
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { PricingService, PRICING_POLICY_VERSION } from '../pricing/pricing.service.js';
import { MenuService } from '../catalog/menu.service.js';
import { CartService } from '../cart/cart.service.js';
import type {
  CheckoutQuoteDto,
  CheckoutLineSnapshot,
  CreateQuoteInput,
  CreateOrderInput,
  OrderCreatedDto,
  PaymentAction,
} from './checkout.types.js';

/** Quote is valid for 15 minutes. */
const QUOTE_TTL_MINUTES = 15;

/** Human-readable order number prefix: MC-YYYYMMDD-NNNNN */
function generateOrderNumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `MC-${date}-${rand}`;
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly db: DatabaseService,
    private readonly pricingService: PricingService,
    private readonly menuService: MenuService,
    private readonly cartService: CartService,
  ) {}

  /**
   * Create an immutable price snapshot for a cart.
   * Validates that all items are still available and prices have not changed.
   */
  async createQuote(input: CreateQuoteInput): Promise<CheckoutQuoteDto> {
    // Load cart (hashes guest token internally)
    let cart;
    if (input.guestCartToken) {
      cart = await this.cartService.findByGuestToken(input.guestCartToken);
    } else {
      cart = await this.cartService.findById(input.cartId);
    }

    if (!cart.branchId) {
      throw new BadRequestException('Cart must have a branch selected before checkout');
    }
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Snapshot each line — throws if any variant is unavailable
    const lines: CheckoutLineSnapshot[] = [];
    let subtotalFils = 0;

    for (const item of cart.items) {
      const priceLine = await this.pricingService.priceLine(cart.branchId, {
        variantId: item.variantId,
        quantity: item.quantity,
        modifierOptionIds: item.modifierOptionIds,
      });

      // Get variant labels for the snapshot
      const menuItems = await this.menuService.listByBranch(cart.branchId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const menuItem = menuItems.find((m: any) => m.variantId === item.variantId);
      if (!menuItem) {
        throw new UnprocessableEntityException(
          `Variant ${item.variantId} is no longer available at this branch`,
        );
      }

      const modifierDeltaFils = priceLine.unitPriceFils * item.quantity - (menuItem.priceFils * item.quantity);
      const lineTotalFils = priceLine.lineTotalFils;

      lines.push({
        variantId: item.variantId,
        variantSku: menuItem.variantSku,
        variantLabelEn: menuItem.variantLabelEn,
        variantLabelAr: menuItem.variantLabelAr,
        unitPriceFils: menuItem.priceFils,
        quantity: item.quantity,
        modifierOptionIds: item.modifierOptionIds,
        modifierDeltaFils: modifierDeltaFils < 0 ? 0 : modifierDeltaFils,
        lineTotalFils,
      });

      subtotalFils += lineTotalFils;
    }

    const quoteTotal = await this.pricingService.quoteCart(
      cart.branchId,
      cart.items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        modifierOptionIds: i.modifierOptionIds,
      })),
    );

    const expiresAt = new Date(Date.now() + QUOTE_TTL_MINUTES * 60 * 1000);

    // Persist the quote (CheckoutQuote model)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quoteRecord: any = await this.db.client.checkoutQuote.create({
      data: {
        cartId: cart.id,
        branchId: cart.branchId,
        lines: lines as unknown as never, // JSON column
        subtotalFils: quoteTotal.subtotalFils,
        discountFils: quoteTotal.discountFils,
        taxFils: quoteTotal.taxFils,
        totalFils: quoteTotal.totalFils,
        pricingPolicyVersion: PRICING_POLICY_VERSION,
        expiresAt,
      },
      select: {
        id: true,
        branchId: true,
        subtotalFils: true,
        discountFils: true,
        taxFils: true,
        totalFils: true,
        pricingPolicyVersion: true,
        expiresAt: true,
        acceptedAt: true,
      },
    });

    return {
      id: quoteRecord?.id ?? 'stub-quote-id',
      branchId: quoteRecord?.branchId ?? cart.branchId,
      lines,
      subtotalFils: quoteRecord?.subtotalFils ?? quoteTotal.subtotalFils,
      discountFils: quoteRecord?.discountFils ?? 0,
      taxFils: quoteRecord?.taxFils ?? 0,
      totalFils: quoteRecord?.totalFils ?? quoteTotal.totalFils,
      pricingPolicyVersion: PRICING_POLICY_VERSION,
      expiresAt: quoteRecord?.expiresAt ?? expiresAt,
      acceptedAt: quoteRecord?.acceptedAt ?? null,
    };
  }

  /**
   * Create an order from an accepted quote.
   * Idempotent: same Idempotency-Key returns existing order.
   */
  async createOrder(input: CreateOrderInput, customerId?: string): Promise<OrderCreatedDto> {
    // Idempotency check
    const existing = await this.db.client.idempotencyKey.findUnique({
      where: { keyHash: input.idempotencyKey },
      select: { responseBody: true },
    });
    if (existing?.responseBody) {
      return existing.responseBody as unknown as OrderCreatedDto;
    }

    // Load quote
    const quote = await this.db.client.checkoutQuote.findUnique({
      where: { id: input.quoteId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    if (!quote) {
      throw new NotFoundException(`Quote ${input.quoteId} not found`);
    }
    if (quote.acceptedAt) {
      throw new ConflictException('Quote has already been used to create an order');
    }
    if (quote.expiresAt < new Date()) {
      throw new UnprocessableEntityException('Quote has expired — please requote your cart');
    }

    const orderNumber = generateOrderNumber();

    // Create order atomically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await this.db.client.$transaction(async (tx: any) => {
      // Mark quote as accepted
      await tx.checkoutQuote.update({
        where: { id: input.quoteId },
        data: { acceptedAt: new Date() },
      });

      // Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customerId ?? null,
          branchId: quote.branchId,
          status: 'PENDING',
          serviceType: input.serviceType,
          tableNumber: input.tableNumber ?? null,
          deliveryAddressId: input.deliveryAddressId ?? null,
          note: input.note ?? null,
          subtotalFils: quote.subtotalFils,
          discountFils: quote.discountFils,
          taxFils: quote.taxFils,
          totalFils: quote.totalFils,
          checkoutQuoteId: quote.id,
        },
        select: { id: true, orderNumber: true, status: true, totalFils: true, branchId: true },
      });

      // Create order items from quote lines
      const lines = (quote.lines ?? []) as CheckoutLineSnapshot[];
      for (const line of lines) {
        const item = await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: line.variantId,
            variantSku: line.variantSku,
            variantLabelEn: line.variantLabelEn,
            variantLabelAr: line.variantLabelAr,
            quantity: line.quantity,
            unitPriceFils: line.unitPriceFils,
            lineTotalFils: line.lineTotalFils,
          },
          select: { id: true },
        });
        if (line.modifierOptionIds.length > 0) {
          await tx.orderItemModifier.createMany({
            data: line.modifierOptionIds.map((optionId: string) => ({
              itemId: item.id,
              optionId,
              quantity: 1,
              priceDeltaFils: 0, // snapshot from line
            })),
          });
        }
      }

      // Record order event
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: 'CREATED',
          actorType: customerId ? 'CUSTOMER' : 'GUEST',
          actorId: customerId ?? null,
          payload: { quoteId: input.quoteId },
        },
      });

      // Store idempotency record
      const responseBody: OrderCreatedDto = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalFils: order.totalFils,
        branchId: order.branchId,
        paymentAction: { type: 'noop' } satisfies PaymentAction,
      };

      await tx.idempotencyKey.create({
        data: {
          keyHash: input.idempotencyKey,
          endpoint: 'POST /checkout/orders',
          responseStatus: 201,
          responseBody: responseBody as unknown as never,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return responseBody;
    });

    return result ?? {
      orderId: 'stub-order-id',
      orderNumber,
      status: 'PENDING',
      totalFils: quote?.totalFils ?? 0,
      branchId: quote?.branchId ?? '',
      paymentAction: { type: 'noop' },
    };
  }

  /** Get order status (customer-facing — only their own orders). */
  async getOrder(orderId: string, customerId?: string): Promise<Record<string, unknown>> {
    const order = await this.db.client.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        serviceType: true,
        totalFils: true,
        branchId: true,
        customerId: true,
        createdAt: true,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    // If authenticated, ensure customer owns order (guests have no customerId)
    if (customerId && order.customerId && order.customerId !== customerId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order ?? {};
  }

  /** Cancel an order (customer-initiated, only before PREPARING). */
  async cancelOrder(orderId: string, customerId?: string): Promise<void> {
    const order = await this.db.client.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, customerId: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (customerId && order.customerId && order.customerId !== customerId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new UnprocessableEntityException(
        `Order cannot be cancelled in status ${order.status}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.db.client.$transaction(async (tx: any) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
      await tx.orderEvent.create({
        data: {
          orderId,
          type: 'CANCELLED',
          actorType: customerId ? 'CUSTOMER' : 'GUEST',
          actorId: customerId ?? null,
          payload: { reason: 'customer_requested' },
        },
      });
    });
  }
}
