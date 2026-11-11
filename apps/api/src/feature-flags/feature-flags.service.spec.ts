import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { FeatureFlagsService, KNOWN_FLAGS } from './feature-flags.service.js';

// Direct class instantiation pattern (NestJS @nestjs/testing doesn't work with Vitest ESM)
function makeDb(overrides: Record<string, any> = {}) {
  const delegates: Record<string, any> = {
    branchFeatureFlag: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue(null),
    },
    branch: {
      findUnique: vi.fn().mockResolvedValue({ id: 'branch-1' }),
    },
    ...overrides,
  };
  return { client: delegates } as any;
}

describe('FeatureFlagsService', () => {
  describe('isEnabled', () => {
    it('returns false when no record exists (default-off)', async () => {
      const db = makeDb();
      const svc = new FeatureFlagsService(db);
      const result = await svc.isEnabled('branch-1', 'ordering');
      expect(result).toBe(false);
    });

    it('returns true when flag is enabled', async () => {
      const db = makeDb({
        branchFeatureFlag: {
          findUnique: vi.fn().mockResolvedValue({ enabled: true }),
        },
      });
      const svc = new FeatureFlagsService(db);
      const result = await svc.isEnabled('branch-1', 'ordering');
      expect(result).toBe(true);
    });

    it('returns false when flag record exists but is disabled', async () => {
      const db = makeDb({
        branchFeatureFlag: {
          findUnique: vi.fn().mockResolvedValue({ enabled: false }),
        },
      });
      const svc = new FeatureFlagsService(db);
      const result = await svc.isEnabled('branch-1', 'ordering');
      expect(result).toBe(false);
    });
  });

  describe('listForBranch', () => {
    it('throws NotFoundException for unknown branch', async () => {
      const db = makeDb({
        branch: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const svc = new FeatureFlagsService(db);
      await expect(svc.listForBranch('no-such-branch')).rejects.toThrow(NotFoundException);
    });

    it('returns all known flags with defaults when none set', async () => {
      const db = makeDb();
      const svc = new FeatureFlagsService(db);
      const result = await svc.listForBranch('branch-1');
      expect(result).toHaveLength(KNOWN_FLAGS.length);
      expect(result.every((f) => f.enabled === false)).toBe(true);
    });

    it('merges existing records into full flag list', async () => {
      const now = new Date();
      const db = makeDb({
        branchFeatureFlag: {
          findMany: vi.fn().mockResolvedValue([
            { flag: 'loyalty', enabled: true, updatedAt: now },
          ]),
        },
      });
      const svc = new FeatureFlagsService(db);
      const result = await svc.listForBranch('branch-1');
      const loyaltyFlag = result.find((f) => f.flag === 'loyalty');
      expect(loyaltyFlag?.enabled).toBe(true);
      const orderingFlag = result.find((f) => f.flag === 'ordering');
      expect(orderingFlag?.enabled).toBe(false);
    });
  });

  describe('setFlag', () => {
    it('throws NotFoundException for unknown branch', async () => {
      const db = makeDb({
        branch: { findUnique: vi.fn().mockResolvedValue(null) },
      });
      const svc = new FeatureFlagsService(db);
      await expect(svc.setFlag('no-branch', 'ordering', true, 'staff-1')).rejects.toThrow(NotFoundException);
    });

    it('upserts and returns updated flag', async () => {
      const now = new Date();
      const db = makeDb({
        branchFeatureFlag: {
          upsert: vi.fn().mockResolvedValue({
            branchId: 'branch-1',
            flag: 'ordering',
            enabled: true,
            updatedAt: now,
          }),
        },
      });
      const svc = new FeatureFlagsService(db);
      const result = await svc.setFlag('branch-1', 'ordering', true, 'staff-1');
      expect(result.enabled).toBe(true);
      expect(result.flag).toBe('ordering');
      expect(db.client.branchFeatureFlag.upsert).toHaveBeenCalledOnce();
    });
  });
});
