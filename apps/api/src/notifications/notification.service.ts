/**
 * NotificationService — delivery record management for customer and staff notifications.
 *
 * This service writes NotificationDelivery records to the database.
 * Actual sending (SMS, push, email) is handled by the worker process
 * via BullMQ jobs (apps/worker, Prompt 11).
 *
 * Notification channels:
 *   - SMS: OTP, order status, collection ready
 *   - Push: order updates (requires D-004 device token storage)
 *   - Email: receipts, corporate quotes (requires D-004)
 *
 * All notification content is TEMPLATE-DRIVEN. No hardcoded text.
 * Arabic template content requires Marketing approval before production.
 *
 * Records are append-only. Failed deliveries are retried by the worker.
 */
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface NotificationPayload {
  recipientId: string;
  recipientType: 'customer' | 'staff';
  channel: 'sms' | 'push' | 'email';
  templateKey: string;
  templateData: Record<string, unknown>;
  locale: 'en' | 'ar';
  orderId?: string | undefined;
  idempotencyKey?: string | undefined;
}

export interface NotificationRecord {
  id: string;
  recipientId: string;
  channel: string;
  templateKey: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class NotificationService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Queue a notification for delivery.
   * Creates a NotificationDelivery record; worker picks it up and sends.
   */
  async queue(payload: NotificationPayload): Promise<NotificationRecord> {
    const now = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record: any = await this.db.client.notificationDelivery.create({
      data: {
        recipientId: payload.recipientId,
        recipientType: payload.recipientType,
        channel: payload.channel,
        templateKey: payload.templateKey,
        templateData: payload.templateData as unknown as never,
        locale: payload.locale,
        orderId: payload.orderId ?? null,
        idempotencyKey: payload.idempotencyKey ?? null,
        status: 'QUEUED',
        attemptCount: 0,
      },
      select: { id: true, recipientId: true, channel: true, templateKey: true, status: true, createdAt: true },
    });

    return {
      id: record?.id ?? 'stub-notification-id',
      recipientId: payload.recipientId,
      channel: payload.channel,
      templateKey: payload.templateKey,
      status: 'QUEUED',
      createdAt: record?.createdAt ?? now,
    };
  }

  /**
   * Queue an order status notification for the customer.
   * Template keys follow the pattern: order.<status>.customer
   */
  async notifyOrderStatus(
    orderId: string,
    customerId: string | null,
    status: string,
    locale: 'en' | 'ar' = 'en',
  ): Promise<void> {
    if (!customerId) return; // Guest orders have no customer to notify

    await this.queue({
      recipientId: customerId,
      recipientType: 'customer',
      channel: 'sms',
      templateKey: `order.${status.toLowerCase()}.customer`,
      templateData: { orderId, status },
      locale,
      orderId,
      idempotencyKey: `order-status-${orderId}-${status}`,
    });
  }

  /**
   * Notify branch staff that a new order has been placed.
   * Template: order.new.staff
   */
  async notifyNewOrder(orderId: string, branchId: string): Promise<void> {
    // Staff notification: use branchId as recipient (fan-out done by worker)
    await this.queue({
      recipientId: branchId,
      recipientType: 'staff',
      channel: 'push',
      templateKey: 'order.new.staff',
      templateData: { orderId, branchId },
      locale: 'en',
      orderId,
      idempotencyKey: `order-new-${orderId}`,
    });
  }

  /**
   * Notify customer that their order is ready for collection.
   * Template: order.ready.customer (highest priority)
   */
  async notifyOrderReady(
    orderId: string,
    customerId: string | null,
    locale: 'en' | 'ar' = 'en',
  ): Promise<void> {
    if (!customerId) return;

    await this.queue({
      recipientId: customerId,
      recipientType: 'customer',
      channel: 'sms',
      templateKey: 'order.ready.customer',
      templateData: { orderId },
      locale,
      orderId,
      idempotencyKey: `order-ready-${orderId}`,
    });
  }
}
