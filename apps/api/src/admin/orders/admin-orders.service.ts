/**
 * AdminOrdersService — branch staff order management.
 *
 * Order state machine (server-enforced):
 *   PENDING → CONFIRMED (payment captured, automatic)
 *   CONFIRMED → ACCEPTED (staff accepts — kitchen/counter)
 *   ACCEPTED → PREPARING
 *   PREPARING → READY
 *   READY → COMPLETED
 *   PENDING | CONFIRMED | ACCEPTED | PREPARING → CANCELLED (with reason)
 *
 * Guards:
 *   - Branch-scoped staff may only act on orders for their branch
 *   - Each transition appends an OrderEvent
 *   - Terminal states (COMPLETED, CANCELLED, FAILED) cannot be exited
 *
 * Blocking decisions:
 *   D-003 — POS authority; POS may push state changes via webhook (Prompt 8)
 *   D-006 — POS vendor
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import { NotificationService } from '../../notifications/notification.service.js';

/** Allowed transitions per current status (staff-initiated). */
const STAFF_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
};

/** Pagination defaults */
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export interface OrderListOptions {
  branchId?: string | undefined;
  status?: string | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
}

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * List orders, branch-scoped for branch staff, global for HQ.
   * Returns cursor-based page.
   */
  async listOrders(
    actorBranchId: string | undefined,
    options: OrderListOptions,
  ): Promise<{ orders: unknown[]; nextCursor: string | null }> {
    const limit = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Branch staff can only see their branch
    if (actorBranchId) {
      where.branchId = actorBranchId;
    } else if (options.branchId) {
      where.branchId = options.branchId;
    }

    if (options.status) {
      where.status = options.status;
    }

    if (options.cursor) {
      where.id = { lt: options.cursor }; // cursor = last id seen
    }

    const orders = await this.db.client.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        serviceType: true,
        tableNumber: true,
        totalFils: true,
        branchId: true,
        customerId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any[];

    const hasMore = (orders ?? []).length > limit;
    const page = hasMore ? (orders ?? []).slice(0, limit) : (orders ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextCursor = hasMore ? (page[page.length - 1] as any)?.id ?? null : null;

    return { orders: page, nextCursor };
  }

  /** Get a single order with items; enforces branch scope. */
  async getOrder(orderId: string, actorBranchId?: string): Promise<unknown> {
    const order = await this.db.client.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        serviceType: true,
        tableNumber: true,
        note: true,
        subtotalFils: true,
        discountFils: true,
        taxFils: true,
        totalFils: true,
        branchId: true,
        customerId: true,
        createdAt: true,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (actorBranchId && order.branchId !== actorBranchId) {
      throw new ForbiddenException('Order does not belong to your branch');
    }

    return order;
  }

  /**
   * Transition order to a new status.
   * Validates the transition against the state machine.
   */
  async transitionOrder(
    orderId: string,
    newStatus: string,
    actorId: string,
    actorBranchId?: string,
    reason?: string,
  ): Promise<unknown> {
    const order = await this.db.client.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, branchId: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (actorBranchId && order.branchId !== actorBranchId) {
      throw new ForbiddenException('Order does not belong to your branch');
    }

    const allowedNextStatuses = STAFF_TRANSITIONS[order.status] ?? [];
    if (!allowedNextStatuses.includes(newStatus)) {
      throw new UnprocessableEntityException(
        `Cannot transition order from ${order.status} to ${newStatus}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await this.db.client.$transaction(async (tx: any) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
        select: { id: true, orderNumber: true, status: true, branchId: true, customerId: true },
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          type: newStatus,
          actorType: 'STAFF',
          actorId,
          payload: reason ? { reason } : {},
        },
      });

      return result;
    });

    // Fire-and-forget notification after transaction commits.
    // Failures are non-fatal — notification retries handled by worker.
    if (newStatus === 'READY') {
      this.notifications
        .notifyOrderReady(orderId, (updated as any)?.customerId ?? null)
        .catch(() => undefined);
    } else {
      this.notifications
        .notifyOrderStatus(orderId, (updated as any)?.customerId ?? null, newStatus)
        .catch(() => undefined);
    }

    return updated;
  }

  /** Accept an order (CONFIRMED → ACCEPTED). */
  async acceptOrder(orderId: string, actorId: string, actorBranchId?: string): Promise<unknown> {
    return this.transitionOrder(orderId, 'ACCEPTED', actorId, actorBranchId);
  }

  /** Mark order as preparing (ACCEPTED → PREPARING). */
  async startPreparing(orderId: string, actorId: string, actorBranchId?: string): Promise<unknown> {
    return this.transitionOrder(orderId, 'PREPARING', actorId, actorBranchId);
  }

  /** Mark order as ready for pickup/delivery (PREPARING → READY). */
  async markReady(orderId: string, actorId: string, actorBranchId?: string): Promise<unknown> {
    return this.transitionOrder(orderId, 'READY', actorId, actorBranchId);
  }

  /** Complete an order (READY → COMPLETED). */
  async completeOrder(orderId: string, actorId: string, actorBranchId?: string): Promise<unknown> {
    return this.transitionOrder(orderId, 'COMPLETED', actorId, actorBranchId);
  }

  /** Cancel an order with a reason. */
  async cancelOrder(
    orderId: string,
    actorId: string,
    reason: string,
    actorBranchId?: string,
  ): Promise<void> {
    await this.transitionOrder(orderId, 'CANCELLED', actorId, actorBranchId, reason);
  }
}
