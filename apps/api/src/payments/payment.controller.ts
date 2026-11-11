/**
 * PaymentController
 *
 * POST /payments/intents       — create payment intent (authenticated)
 * POST /webhooks/payments/:provider — provider webhook (no auth, raw body, signature verified)
 * POST /orders/:id/refunds     — request refund (staff only — Prompt 8 extends this)
 * GET  /orders/:id/refunds     — list refunds for an order
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Req,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentService } from './payment.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { CreatePaymentIntentInput, CreateRefundInput } from './payment.types.js';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * POST /payments/intents
   * Authenticated customer creates a payment intent for their order.
   */
  @Post('payments/intents')
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async createIntent(
    @Body() body: CreatePaymentIntentInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.createIntent(body, user.id);
  }

  /**
   * POST /webhooks/payments/:provider
   * Receives raw webhook from payment gateway.
   * Raw body must be preserved for signature verification.
   * Note: NestJS bodyParser must be disabled on this route in main.ts (Prompt 12).
   */
  @Post('webhooks/payments/:provider')
  @HttpCode(200)
  async handleWebhook(
    @Param('provider') provider: string,
    @Headers('x-signature') signature: string,
    @Req() req: Request,
  ) {
    // Raw body access requires rawBody middleware (configured in bootstrap)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawBody: Buffer = (req as any).rawBody ?? Buffer.from('');
    await this.paymentService.processWebhook({ provider, rawBody, signature });
    return { received: true };
  }

  /**
   * POST /orders/:id/refunds
   * Staff-initiated refund (role check extended in Prompt 8).
   */
  @Post('orders/:id/refunds')
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async createRefund(
    @Param('id') orderId: string,
    @Body() body: Omit<CreateRefundInput, 'idempotencyKey'>,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.createRefund(
      orderId,
      { ...body, idempotencyKey },
      user.id,
    );
  }

  /**
   * GET /orders/:id/refunds
   * List refunds for an order.
   */
  @Get('orders/:id/refunds')
  @UseGuards(JwtAuthGuard)
  async listRefunds(@Param('id') orderId: string) {
    return this.paymentService.listRefunds(orderId);
  }
}
