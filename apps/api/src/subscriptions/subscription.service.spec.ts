import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';

function makeDb(overrides: { subscription?: any; subscriptionCycle?: any } = {}) {
  return {
    client: {
      subscription: {
        create: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue(null),
        ...(overrides['subscription'] ?? {}),
      },
      subscriptionCycle: {
        create: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        ...(overrides['subscriptionCycle'] ?? {}),
      },
    },
  } as any;
}

function makeFlags(subscriptionsEnabled = true) {
  return {
    isEnabled: vi.fn().mockResolvedValue(subscriptionsEnabled),
  } as any;
}

const mockSub = {
  id: 'sub-1',
  customerId: 'cust-1',
  planId: 'plan-monthly',
  status: 'ACTIVE',
  recurringConsent: true,
  nextBillingAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SubscriptionService', () => {
  describe('createSubscription', () => {
    it('throws BadRequestException when recurringConsent is false', async () => {
      const db = makeDb();
      const flags = makeFlags(true);
      const svc = new SubscriptionService(db, flags);
      await expect(
        svc.createSubscription({
          customerId: 'cust-1',
          planId: 'plan-1',
          branchId: 'branch-1',
          recurringConsent: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when subscriptions flag disabled', async () => {
      const db = makeDb();
      const flags = makeFlags(false);
      const svc = new SubscriptionService(db, flags);
      await expect(
        svc.createSubscription({
          customerId: 'cust-1',
          planId: 'plan-1',
          branchId: 'branch-1',
          recurringConsent: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException for duplicate active subscription', async () => {
      const db = makeDb({
        subscription: { findFirst: vi.fn().mockResolvedValue({ id: 'existing-sub' }) },
      });
      const flags = makeFlags(true);
      const svc = new SubscriptionService(db, flags);
      await expect(
        svc.createSubscription({
          customerId: 'cust-1',
          planId: 'plan-monthly',
          branchId: 'branch-1',
          recurringConsent: true,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates subscription on happy path', async () => {
      const db = makeDb({
        subscription: { create: vi.fn().mockResolvedValue(mockSub) },
      });
      const flags = makeFlags(true);
      const svc = new SubscriptionService(db, flags);
      const result = await svc.createSubscription({
        customerId: 'cust-1',
        planId: 'plan-monthly',
        branchId: 'branch-1',
        recurringConsent: true,
      });
      expect(result.id).toBe('sub-1');
      expect(result.recurringConsent).toBe(true);
    });
  });

  describe('getSubscription', () => {
    it('throws NotFoundException for unknown subscription', async () => {
      const db = makeDb();
      const flags = makeFlags();
      const svc = new SubscriptionService(db, flags);
      await expect(svc.getSubscription('no-id', 'cust-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when customerId does not match', async () => {
      const db = makeDb({
        subscription: { findUnique: vi.fn().mockResolvedValue({ ...mockSub, customerId: 'other-cust' }) },
      });
      const flags = makeFlags();
      const svc = new SubscriptionService(db, flags);
      await expect(svc.getSubscription('sub-1', 'cust-1')).rejects.toThrow(NotFoundException);
    });

    it('returns subscription for correct customer', async () => {
      const db = makeDb({
        subscription: { findUnique: vi.fn().mockResolvedValue(mockSub) },
      });
      const flags = makeFlags();
      const svc = new SubscriptionService(db, flags);
      const result = await svc.getSubscription('sub-1', 'cust-1');
      expect(result.id).toBe('sub-1');
    });
  });

  describe('pauseSubscription', () => {
    it('throws BadRequestException for non-ACTIVE subscription', async () => {
      const db = makeDb({
        subscription: { findUnique: vi.fn().mockResolvedValue({ ...mockSub, status: 'PAUSED' }) },
      });
      const flags = makeFlags();
      const svc = new SubscriptionService(db, flags);
      await expect(svc.pauseSubscription('sub-1', 'cust-1')).rejects.toThrow(BadRequestException);
    });

    it('transitions ACTIVE → PAUSED', async () => {
      const db = makeDb({
        subscription: {
          findUnique: vi.fn().mockResolvedValue(mockSub),
          update: vi.fn().mockResolvedValue({ ...mockSub, status: 'PAUSED' }),
        },
      });
      const flags = makeFlags();
      const svc = new SubscriptionService(db, flags);
      const result = await svc.pauseSubscription('sub-1', 'cust-1');
      expect(result.status).toBe('PAUSED');
    });
  });

  describe('cancelSubscription', () => {
    it('throws BadRequestException for already-cancelled subscription', async () => {
      const db = makeDb({
        subscription: { findUnique: vi.fn().mockResolvedValue({ ...mockSub, status: 'CANCELLED' }) },
      });
      const flags = makeFlags();
      const svc = new SubscriptionService(db, flags);
      await expect(svc.cancelSubscription('sub-1', 'cust-1')).rejects.toThrow(BadRequestException);
    });

    it('transitions ACTIVE → CANCELLED', async () => {
      const db = makeDb({
        subscription: {
          findUnique: vi.fn().mockResolvedValue(mockSub),
          update: vi.fn().mockResolvedValue({ ...mockSub, status: 'CANCELLED', nextBillingAt: null }),
        },
      });
      const flags = makeFlags();
      const svc = new SubscriptionService(db, flags);
      const result = await svc.cancelSubscription('sub-1', 'cust-1');
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('recordCycle', () => {
    it('creates billing cycle record', async () => {
      const cycleRecord = {
        id: 'cycle-1',
        subscriptionId: 'sub-1',
        billingCycle: '2024-11',
        orderId: 'order-1',
        amountFils: 15000,
        billedAt: new Date(),
        createdAt: new Date(),
      };
      const db = makeDb({
        subscriptionCycle: { create: vi.fn().mockResolvedValue(cycleRecord) },
      });
      const flags = makeFlags();
      const svc = new SubscriptionService(db, flags);
      const result = await svc.recordCycle('sub-1', '2024-11', 15000, 'order-1');
      expect(result.billingCycle).toBe('2024-11');
      expect(result.amountFils).toBe(15000);
    });
  });
});
