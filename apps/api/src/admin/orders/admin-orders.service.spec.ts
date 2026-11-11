/**
 * AdminOrdersService unit tests.
 *
 * Uses direct instantiation (not @nestjs/testing) due to Vitest ESM DI
 * incompatibility with NestJS reflect-metadata decorator resolution.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminOrdersService } from './admin-orders.service.js';
import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDb(overrides: Record<string, unknown> = {}) {
  const txFn = vi.fn();
  return {
    client: {
      order: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
      },
      orderEvent: {
        create: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
        // Simulate prisma interactive transaction by passing a mini-client
        const tx = {
          order: {
            update: vi.fn().mockResolvedValue({
              id: 'order-1',
              orderNumber: 'MC-20260101-00001',
              status: 'ACCEPTED',
              branchId: 'branch-1',
              customerId: 'customer-1',
            }),
          },
          orderEvent: { create: vi.fn().mockResolvedValue({}) },
        };
        txFn.mockResolvedValue(tx);
        return fn(tx);
      }),
      ...overrides,
    },
  };
}

function makeNotifications() {
  return {
    queue: vi.fn().mockResolvedValue({ id: 'notif-1', status: 'QUEUED', createdAt: new Date() }),
    notifyOrderStatus: vi.fn().mockResolvedValue(undefined),
    notifyNewOrder: vi.fn().mockResolvedValue(undefined),
    notifyOrderReady: vi.fn().mockResolvedValue(undefined),
  };
}

function makeOrder(partial: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'MC-20260101-00001',
    status: 'CONFIRMED',
    branchId: 'branch-1',
    customerId: 'customer-1',
    serviceType: 'TAKEAWAY',
    totalFils: 2500,
    createdAt: new Date(),
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminOrdersService', () => {
  let service: AdminOrdersService;
  let db: ReturnType<typeof makeDb>;
  let notifications: ReturnType<typeof makeNotifications>;

  beforeEach(() => {
    db = makeDb();
    notifications = makeNotifications();
    service = new AdminOrdersService(db as any, notifications as any);
  });

  // -------------------------------------------------------------------------
  // listOrders
  // -------------------------------------------------------------------------

  describe('listOrders', () => {
    it('scopes query to actorBranchId when provided', async () => {
      db.client.order.findMany.mockResolvedValue([]);

      await service.listOrders('branch-1', {});

      const [call] = db.client.order.findMany.mock.calls as any[];
      expect(call[0].where.branchId).toBe('branch-1');
    });

    it('applies optional status filter', async () => {
      db.client.order.findMany.mockResolvedValue([]);

      await service.listOrders(undefined, { status: 'PENDING', branchId: 'branch-2' });

      const [call] = db.client.order.findMany.mock.calls as any[];
      expect(call[0].where.status).toBe('PENDING');
      expect(call[0].where.branchId).toBe('branch-2');
    });

    it('returns nextCursor when more records exist', async () => {
      // Return 26 items for a limit-25 query → hasMore=true
      const items = Array.from({ length: 26 }, (_, i) => makeOrder({ id: `order-${i}` }));
      db.client.order.findMany.mockResolvedValue(items);

      const result = await service.listOrders(undefined, { limit: 25 });

      expect(result.orders).toHaveLength(25);
      expect(result.nextCursor).toBe('order-24');
    });
  });

  // -------------------------------------------------------------------------
  // getOrder
  // -------------------------------------------------------------------------

  describe('getOrder', () => {
    it('throws NotFoundException for unknown order', async () => {
      db.client.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrder('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when branch mismatch', async () => {
      db.client.order.findUnique.mockResolvedValue(makeOrder({ branchId: 'branch-999' }));

      await expect(service.getOrder('order-1', 'branch-1')).rejects.toThrow(ForbiddenException);
    });

    it('returns order when branch matches', async () => {
      db.client.order.findUnique.mockResolvedValue(makeOrder());

      const result = await service.getOrder('order-1', 'branch-1');

      expect((result as any).id).toBe('order-1');
    });
  });

  // -------------------------------------------------------------------------
  // transitionOrder
  // -------------------------------------------------------------------------

  describe('transitionOrder', () => {
    it('throws NotFoundException for unknown order', async () => {
      db.client.order.findUnique.mockResolvedValue(null);

      await expect(
        service.transitionOrder('nonexistent', 'ACCEPTED', 'staff-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException for invalid transition', async () => {
      db.client.order.findUnique.mockResolvedValue(makeOrder({ status: 'PENDING' }));

      await expect(
        service.transitionOrder('order-1', 'COMPLETED', 'staff-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws ForbiddenException for wrong branch', async () => {
      db.client.order.findUnique.mockResolvedValue(makeOrder({ branchId: 'branch-999' }));

      await expect(
        service.transitionOrder('order-1', 'ACCEPTED', 'staff-1', 'branch-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('executes transaction and fires notification for ACCEPTED', async () => {
      db.client.order.findUnique.mockResolvedValue(makeOrder({ status: 'CONFIRMED' }));

      await service.transitionOrder('order-1', 'ACCEPTED', 'staff-1', 'branch-1');

      // Notification fired (fire-and-forget, may not await)
      await vi.waitFor(() => {
        expect(notifications.notifyOrderStatus).toHaveBeenCalledWith(
          'order-1',
          expect.anything(),
          'ACCEPTED',
        );
      });
    });

    it('fires notifyOrderReady for READY transition', async () => {
      db.client.order.findUnique.mockResolvedValue(makeOrder({ status: 'PREPARING' }));
      // Override $transaction to return READY status
      db.client.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          order: { update: vi.fn().mockResolvedValue({ id: 'order-1', status: 'READY', branchId: 'branch-1', customerId: 'customer-1' }) },
          orderEvent: { create: vi.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      await service.transitionOrder('order-1', 'READY', 'staff-1', 'branch-1');

      await vi.waitFor(() => {
        expect(notifications.notifyOrderReady).toHaveBeenCalledWith('order-1', 'customer-1');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Convenience methods
  // -------------------------------------------------------------------------

  describe('acceptOrder / startPreparing / markReady / completeOrder / cancelOrder', () => {
    it('acceptOrder delegates to transitionOrder with ACCEPTED', async () => {
      const spy = vi.spyOn(service, 'transitionOrder').mockResolvedValue({} as any);
      await service.acceptOrder('order-1', 'staff-1', 'branch-1');
      expect(spy).toHaveBeenCalledWith('order-1', 'ACCEPTED', 'staff-1', 'branch-1');
    });

    it('cancelOrder delegates with CANCELLED and reason', async () => {
      const spy = vi.spyOn(service, 'transitionOrder').mockResolvedValue({} as any);
      await service.cancelOrder('order-1', 'staff-1', 'out of stock', 'branch-1');
      expect(spy).toHaveBeenCalledWith('order-1', 'CANCELLED', 'staff-1', 'branch-1', 'out of stock');
    });
  });
});
