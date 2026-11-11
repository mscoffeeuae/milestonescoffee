/**
 * CheckoutController — quote creation and order placement endpoints.
 *
 * POST /checkout/quotes  — create immutable price snapshot from cart
 * POST /checkout/orders  — place order from accepted quote (Idempotency-Key required)
 * GET  /orders/:id       — get order status
 * POST /orders/:id/cancel — customer-initiated cancellation
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpCode,
  UseGuards,
  Optional,
} from '@nestjs/common';
import { CheckoutService } from './checkout.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type {
  CreateQuoteInput,
  CreateOrderInput,
  CheckoutQuoteDto,
  OrderCreatedDto,
} from './checkout.types.js';

@Controller()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  /**
   * POST /checkout/quotes
   * Creates an immutable price quote from the cart.
   * Does not require authentication (supports guest checkout).
   */
  @Post('checkout/quotes')
  @HttpCode(201)
  async createQuote(@Body() body: CreateQuoteInput): Promise<CheckoutQuoteDto> {
    return this.checkoutService.createQuote(body);
  }

  /**
   * POST /checkout/orders
   * Places an order from an accepted quote.
   * Idempotency-Key header is required.
   */
  @Post('checkout/orders')
  @HttpCode(201)
  async createOrder(
    @Body() body: Omit<CreateOrderInput, 'idempotencyKey'>,
    @Headers('idempotency-key') idempotencyKey: string,
    @Optional() @CurrentUser() user?: AuthenticatedUser,
  ): Promise<OrderCreatedDto> {
    if (!idempotencyKey) {
      // Guard: idempotency key is required
      throw Object.assign(new Error('Idempotency-Key header is required'), { status: 422 });
    }
    return this.checkoutService.createOrder(
      { ...body, idempotencyKey },
      user?.id,
    );
  }

  /**
   * GET /orders/:id
   * Returns order status. Auth optional — authenticated users see only their own orders.
   */
  @Get('orders/:id')
  async getOrder(
    @Param('id') id: string,
    @Optional() @CurrentUser() user?: AuthenticatedUser,
  ): Promise<Record<string, unknown>> {
    return this.checkoutService.getOrder(id, user?.id);
  }

  /**
   * POST /orders/:id/cancel
   * Customer-initiated cancellation (only before PREPARING).
   */
  @Post('orders/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async cancelOrder(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.checkoutService.cancelOrder(id, user.id);
  }
}
