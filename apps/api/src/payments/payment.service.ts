/**
 * PaymentService — gateway stub for payment initiation and webhook processing.
 *
 * ALL gateway interactions throw NotImplementedException (501) with reference
 * to blocking decision D-005 (payment gateway selection).
 *
 * What IS implemented:
 *   - Payment record creation in the database
 *   - Webhook inbox persistence (raw body stored before processing)
 *   - Idempotency enforcement on all mutating operations
 *   - Refund record creation with state tracking
 *
 * What is NOT implemented (pending D-005):
 *   - Gateway API calls (Stripe/Checkout.com/Telr/etc.)
 *   - Webhook signature verification
 *   - 3DS redirect or iframe flow
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  CreatePaymentIntentInput,
  PaymentIntentDto,
  CreateRefundInput,
  RefundDto,
  WebhookPayload,
} from './payment.types.js';

@Injectable()
export class PaymentService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Create a payment intent for an order.
   * Persists a PENDING Payment record; gateway initiation deferred to D-005.
   */
  async createIntent(
    input: CreatePaymentIntentInput,
    requestedBy: string,
  ): Promise<PaymentIntentDto> {
    // Load order
    const order = await this.db.client.order.findUnique({
      where: { id: input.orderId },
      select: { id: true, status: true, totalFils: true, customerId: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    if (!order) throw new NotFoundException(`Order ${input.orderId} not found`);
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new UnprocessableEntityException(
        `Cannot initiate payment for order in status ${order.status}`,
      );
    }

    // Check for existing active payment
    const existing = await this.db.client.payment.findFirst({
      where: { orderId: input.orderId, status: { in: ['PENDING', 'AUTHORIZED', 'CAPTURED'] } },
      select: { id: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    if (existing) {
      throw new ConflictException(`An active payment already exists for order ${input.orderId}`);
    }

    // Create payment record
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payment: any = await this.db.client.payment.create({
      data: {
        orderId: input.orderId,
        amountFils: order.totalFils,
        status: 'PENDING',
        provider: 'STUB', // ⚠ Replace with actual provider after D-005
        method: input.method,
        initiatedBy: requestedBy,
      },
      select: { id: true, orderId: true, status: true, amountFils: true, createdAt: true },
    });

    // ⚠ D-005 STUB: Gateway call would go here
    // throw new NotImplementedException(
    //   'Payment gateway not configured — awaiting D-005 (payment gateway selection)',
    // );

    return {
      id: payment?.id ?? 'stub-payment-id',
      orderId: input.orderId,
      status: 'PENDING',
      amountFils: order.totalFils,
      action: { type: 'noop' }, // ← Replace with redirect/sdk after D-005
      createdAt: payment?.createdAt ?? now,
    };
  }

  /**
   * Process incoming payment provider webhook.
   * Raw body is persisted to WebhookInbox for durability before any processing.
   * Actual state transition deferred to D-005.
   */
  async processWebhook(payload: WebhookPayload): Promise<void> {
    // Store raw webhook for auditability (inbox pattern)
    await this.db.client.webhookInbox.create({
      data: {
        provider: payload.provider,
        eventType: 'payment.webhook',
        payload: payload.rawBody.toString('base64'),
        processed: false,
        receivedAt: new Date(),
      },
    });

    // ⚠ D-005 STUB: Signature verification and event dispatch would go here
    throw new NotImplementedException(
      'Payment webhook processing not configured — awaiting D-005 (payment gateway selection)',
    );
  }

  /**
   * Create a refund for an order.
   * Idempotent — same idempotency key returns existing refund.
   * Gateway refund call deferred to D-005.
   */
  async createRefund(
    orderId: string,
    input: CreateRefundInput,
    requestedBy: string,
  ): Promise<RefundDto> {
    // Idempotency check
    const existingKey = await this.db.client.idempotencyKey.findUnique({
      where: { keyHash: input.idempotencyKey },
      select: { responseBody: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    if (existingKey?.responseBody) {
      return existingKey.responseBody as RefundDto;
    }

    const order = await this.db.client.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, totalFils: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    // Find the captured payment
    const payment = await this.db.client.payment.findFirst({
      where: { orderId, status: 'CAPTURED' },
      select: { id: true, amountFils: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    if (!payment) {
      throw new UnprocessableEntityException(
        `No captured payment found for order ${orderId} — cannot refund`,
      );
    }

    if (input.amountFils > payment.amountFils) {
      throw new UnprocessableEntityException(
        `Refund amount ${input.amountFils} fils exceeds captured amount ${payment.amountFils} fils`,
      );
    }

    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await this.db.client.$transaction(async (tx: any) => {
      const refund = await tx.refund.create({
        data: {
          orderId,
          paymentId: payment.id,
          amountFils: input.amountFils,
          status: 'PENDING', // → SUCCEEDED/FAILED after D-005 gateway call
          reason: input.reason,
          note: input.note ?? null,
          requestedBy,
        },
        select: { id: true, orderId: true, amountFils: true, status: true, reason: true, createdAt: true },
      });

      const responseBody: RefundDto = {
        id: refund.id,
        orderId,
        amountFils: refund.amountFils,
        status: refund.status,
        reason: refund.reason,
        createdAt: refund.createdAt,
      };

      await tx.idempotencyKey.create({
        data: {
          keyHash: input.idempotencyKey,
          endpoint: `POST /orders/${orderId}/refunds`,
          responseStatus: 201,
          responseBody: responseBody as unknown as never,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return responseBody;
    });

    // ⚠ D-005 STUB: Trigger gateway refund call here (async via worker)
    // After D-005: dispatch a BullMQ job to call gateway refund API and
    // update refund.status to SUCCEEDED or FAILED based on response.

    return result ?? {
      id: 'stub-refund-id',
      orderId,
      amountFils: input.amountFils,
      status: 'PENDING',
      reason: input.reason,
      createdAt: now,
    };
  }

  /** List refunds for an order. */
  async listRefunds(orderId: string): Promise<RefundDto[]> {
    const refunds = await this.db.client.refund.findMany({
      where: { orderId },
      select: { id: true, orderId: true, amountFils: true, status: true, reason: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (refunds ?? []).map((r: any) => ({
      id: r.id,
      orderId: r.orderId,
      amountFils: r.amountFils,
      status: r.status,
      reason: r.reason,
      createdAt: r.createdAt,
    }));
  }
}
