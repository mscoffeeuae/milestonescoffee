/**
 * Feature flags service — per-branch on/off switches for Phase 2+ features.
 *
 * All Phase 2+ capabilities (ordering, loyalty, subscriptions, QR ordering,
 * recommendations, gift-cards) default to DISABLED for every branch.
 * Staff with HQ role may enable/disable flags via the admin API.
 *
 * The service is intentionally thin — consumers call isEnabled() before
 * performing feature-gated operations.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export const KNOWN_FLAGS = [
  'ordering',
  'loyalty',
  'gift_cards',
  'subscriptions',
  'qr_ordering',
  'recommendations',
  'shop',
] as const;

export type FeatureFlag = (typeof KNOWN_FLAGS)[number];

export interface BranchFlagDto {
  branchId: string;
  flag: string;
  enabled: boolean;
  updatedAt: Date;
}

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Returns true if the feature flag is enabled for the given branch.
   * Missing flags are treated as disabled (default-off).
   */
  async isEnabled(branchId: string, flag: FeatureFlag): Promise<boolean> {
    const record = await this.db.client.branchFeatureFlag.findUnique({
      where: { branchId_flag: { branchId, flag } },
      select: { enabled: true },
    });
    return record?.enabled === true;
  }

  /**
   * Returns all flags for a branch (including those not yet set — shown as disabled).
   */
  async listForBranch(branchId: string): Promise<BranchFlagDto[]> {
    // Verify branch exists
    const branch = await this.db.client.branch.findUnique({
      where: { id: branchId },
      select: { id: true },
    });
    if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);

    const records = await this.db.client.branchFeatureFlag.findMany({
      where: { branchId },
    });

    const recordMap = new Map(
      (records as Array<{ flag: string; enabled: boolean; updatedAt: Date }>).map((r) => [r.flag, r]),
    );

    return KNOWN_FLAGS.map((flag) => {
      const rec = recordMap.get(flag);
      const enabled: boolean = rec ? rec.enabled : false;
      const updatedAt: Date = rec ? rec.updatedAt : new Date(0);
      return { branchId, flag, enabled, updatedAt };
    });
  }

  /**
   * Set a feature flag for a branch. Creates if not present, updates if exists.
   * staffId is recorded for audit trail.
   */
  async setFlag(
    branchId: string,
    flag: FeatureFlag,
    enabled: boolean,
    staffId: string,
  ): Promise<BranchFlagDto> {
    const branch = await this.db.client.branch.findUnique({
      where: { id: branchId },
      select: { id: true },
    });
    if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);

    const record = await this.db.client.branchFeatureFlag.upsert({
      where: { branchId_flag: { branchId, flag } },
      update: { enabled, setByStaffId: staffId },
      create: { branchId, flag, enabled, setByStaffId: staffId },
    });

    return {
      branchId: record.branchId,
      flag: record.flag,
      enabled: record.enabled,
      updatedAt: record.updatedAt,
    };
  }
}
