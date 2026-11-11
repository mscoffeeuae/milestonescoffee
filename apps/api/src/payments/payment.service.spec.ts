/**
 * PaymentService unit tests — direct instantiation (avoids NestJS DI in Vitest).
 */
import { NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service.js';

function makeDb() {
  const noop = () => Promise.resolve(null);
  return {
    client: {
      order: { findUnique: noop },
      payment: { create: noop, findFirst: noop },
      refund: { create: noop, findMany: () => Promise.resolve([]) },
      webhookInbox: { create: noop },
      idempotencyKey: { create: noop, findUnique: noop },
      $transaction: (fn: unknown) => typeof fn === 'function' ? fn({
        refund: { create: noop },
        idempotencyKey: { create: noop },
      }) : Promise.resolve([]),
    },
  };
}

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new PaymentService(makeDb() as any);
  });

  describe('createIntent', () => {
    it('throws NotFoundException for unknown order', async () => {
      await expect(service.createIntent({ orderId: 'x', method: 'card' }, 'user1'))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createRefund', () => {
    it('throws NotFoundException for unknown order', async () => {
      await expect(service.createRefund('x', {
        amountFils: 100,
        reason: 'test',
        idempotencyKey: 'key1',
      }, 'user1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listRefunds', () => {
    it('returns empty array when no refunds exist', async () => {
      const result = await service.listRefunds('order1');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });
});
