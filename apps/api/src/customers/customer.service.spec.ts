/**
 * CustomerService unit tests.
 * Direct instantiation pattern (Vitest ESM DI issue).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerService } from './customer.service.js';
import { NotFoundException, ConflictException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCustomer(partial: Record<string, unknown> = {}) {
  return {
    id: 'cust-1',
    name: 'Ali Hassan',
    email: 'ali@example.com',
    phoneE164: '+971501234567',
    locale: 'en',
    createdAt: new Date(),
    ...partial,
  };
}

function makeAddress(partial: Record<string, unknown> = {}) {
  return {
    id: 'addr-1',
    customerId: 'cust-1',
    label: 'Home',
    line1: '123 Main St',
    line2: null,
    city: 'Dubai',
    emirate: 'Dubai',
    country: 'AE',
    isDefault: true,
    createdAt: new Date(),
    ...partial,
  };
}

function makeDb() {
  return {
    client: {
      customer: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue(makeCustomer()),
      },
      customerAddress: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(makeAddress()),
        update: vi.fn().mockResolvedValue(makeAddress()),
        updateMany: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
      },
      customerConsent: {
        create: vi.fn().mockResolvedValue({}),
      },
      customerDeletionRequest: {
        create: vi.fn().mockResolvedValue({}),
      },
      order: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
        const tx = {
          customerAddress: {
            findFirst: vi.fn().mockResolvedValue(makeAddress()),
            create: vi.fn().mockResolvedValue(makeAddress()),
            update: vi.fn().mockResolvedValue(makeAddress()),
            updateMany: vi.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      }),
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CustomerService', () => {
  let service: CustomerService;
  let db: ReturnType<typeof makeDb>;

  beforeEach(() => {
    db = makeDb();
    service = new CustomerService(db as any);
  });

  // -------------------------------------------------------------------------
  // getProfile
  // -------------------------------------------------------------------------

  describe('getProfile', () => {
    it('throws NotFoundException for deleted or missing customer', async () => {
      db.client.customer.findUnique.mockResolvedValue(null);
      await expect(service.getProfile('cust-404')).rejects.toThrow(NotFoundException);
    });

    it('returns mapped profile', async () => {
      db.client.customer.findUnique.mockResolvedValue(makeCustomer());

      const profile = await service.getProfile('cust-1');

      expect(profile.id).toBe('cust-1');
      expect(profile.name).toBe('Ali Hassan');
      expect(profile.locale).toBe('en');
    });
  });

  // -------------------------------------------------------------------------
  // updateProfile
  // -------------------------------------------------------------------------

  describe('updateProfile', () => {
    it('throws ConflictException if email already in use', async () => {
      db.client.customer.findFirst.mockResolvedValue({ id: 'other-cust' });

      await expect(
        service.updateProfile('cust-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('updates profile when no conflict', async () => {
      db.client.customer.findFirst.mockResolvedValue(null);
      db.client.customer.update.mockResolvedValue(makeCustomer({ name: 'Updated Name' }));

      const result = await service.updateProfile('cust-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });
  });

  // -------------------------------------------------------------------------
  // listAddresses
  // -------------------------------------------------------------------------

  describe('listAddresses', () => {
    it('returns empty array when no addresses', async () => {
      db.client.customerAddress.findMany.mockResolvedValue([]);
      const result = await service.listAddresses('cust-1');
      expect(result).toEqual([]);
    });

    it('maps addresses correctly', async () => {
      db.client.customerAddress.findMany.mockResolvedValue([makeAddress()]);

      const result = await service.listAddresses('cust-1');

      expect(result[0]?.id).toBe('addr-1');
      expect(result[0]?.emirate).toBe('Dubai');
    });
  });

  // -------------------------------------------------------------------------
  // deleteAddress
  // -------------------------------------------------------------------------

  describe('deleteAddress', () => {
    it('throws NotFoundException for unowned address', async () => {
      (db.client.customerAddress as any).findFirst = vi.fn().mockResolvedValue(null);

      await expect(service.deleteAddress('cust-1', 'addr-404')).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // listOrders
  // -------------------------------------------------------------------------

  describe('listOrders', () => {
    it('returns orders with nextCursor when page is full', async () => {
      const orders = Array.from({ length: 21 }, (_, i) => ({ id: `order-${i}`, status: 'COMPLETED' }));
      db.client.order.findMany.mockResolvedValue(orders);

      const result = await service.listOrders('cust-1', { limit: 20 });

      expect(result.orders).toHaveLength(20);
      expect(result.nextCursor).toBe('order-19');
    });
  });

  // -------------------------------------------------------------------------
  // requestDeletion
  // -------------------------------------------------------------------------

  describe('requestDeletion', () => {
    it('schedules deletion 90 days from now', async () => {
      const result = await service.requestDeletion('cust-1');
      const scheduledFor = new Date(result.scheduledFor);
      const diff = scheduledFor.getTime() - Date.now();
      // Should be approximately 90 days (within 1 day tolerance)
      expect(diff).toBeGreaterThan(89 * 24 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(91 * 24 * 60 * 60 * 1000);
    });
  });
});
