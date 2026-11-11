/**
 * QR code service — generate, resolve and manage QR codes for:
 *   - TABLE_ORDER:      table-side ordering (gated: qr_ordering flag)
 *   - LOYALTY_CHECKIN:  scan to earn loyalty points at a branch (gated: loyalty flag)
 *   - PROMOTION:        scan to redeem a promotion code (gated: ordering flag)
 *   - TAKEAWAY_PICKUP:  scan to confirm order pickup
 *
 * Tokens are 32 bytes of cryptographic randomness encoded as URL-safe base64.
 * No QR image is generated here — the web app renders the token into a QR image.
 * The API returns the token; callers embed it in their QR renderer.
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import { FeatureFlagsService, FeatureFlag } from '../feature-flags/feature-flags.service.js';
import { QrCodeType, QrCodeStatus } from '@milestones/database';

export interface CreateQrInput {
  branchId: string;
  type: QrCodeType;
  referenceId?: string | undefined;
  label?: string | undefined;
  expiresAt?: Date | undefined;
}

export interface QrCodeDto {
  id: string;
  branchId: string;
  type: QrCodeType;
  status: QrCodeStatus;
  token: string;
  referenceId: string | null;
  label: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface QrResolveResult {
  qrCode: QrCodeDto;
  /** Scan log id for audit trail */
  scanLogId: string;
}

/** Map from QR type to the feature flag that gates it. */
const FLAG_FOR_TYPE: Record<QrCodeType, FeatureFlag | null> = {
  TABLE_ORDER: 'qr_ordering',
  LOYALTY_CHECKIN: 'loyalty',
  PROMOTION: 'ordering',
  TAKEAWAY_PICKUP: null, // Always allowed once order exists
};

@Injectable()
export class QrService {
  constructor(
    private readonly db: DatabaseService,
    private readonly flags: FeatureFlagsService,
  ) {}

  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private mapToDto(record: any): QrCodeDto {
    return {
      id: record.id,
      branchId: record.branchId,
      type: record.type as QrCodeType,
      status: record.status as QrCodeStatus,
      token: record.token,
      referenceId: record.referenceId ?? null,
      label: record.label ?? null,
      expiresAt: record.expiresAt ?? null,
      createdAt: record.createdAt,
    };
  }

  /** Create a QR code (admin only). Flag is checked for the branch. */
  async createQrCode(input: CreateQrInput): Promise<QrCodeDto> {
    const requiredFlag = FLAG_FOR_TYPE[input.type];
    if (requiredFlag) {
      const enabled = await this.flags.isEnabled(input.branchId, requiredFlag);
      if (!enabled) {
        throw new ForbiddenException(
          `Feature '${requiredFlag}' is not enabled for branch ${input.branchId}`,
        );
      }
    }

    const record = await this.db.client.qrCode.create({
      data: {
        branchId: input.branchId,
        type: input.type,
        status: QrCodeStatus.ACTIVE,
        token: this.generateToken(),
        referenceId: input.referenceId ?? null,
        label: input.label ?? null,
        expiresAt: input.expiresAt ?? null,
      },
    });

    return this.mapToDto(record);
  }

  /**
   * Resolve a QR token scan.
   * - Verifies token exists and is ACTIVE
   * - Checks expiry
   * - Checks feature flag for the branch
   * - Appends scan log
   * Returns the QR code DTO + scan log id.
   */
  async resolveToken(
    token: string,
    opts: { customerId?: string | undefined; userAgent?: string | undefined; ipHash?: string | undefined },
  ): Promise<QrResolveResult> {
    const record = await this.db.client.qrCode.findUnique({
      where: { token },
    });

    if (!record) throw new NotFoundException('QR code not found');
    if (record.status !== QrCodeStatus.ACTIVE) {
      throw new ForbiddenException(`QR code is ${record.status.toLowerCase()}`);
    }
    if (record.expiresAt && record.expiresAt < new Date()) {
      // Auto-expire
      await this.db.client.qrCode.update({
        where: { id: record.id },
        data: { status: QrCodeStatus.EXPIRED },
      });
      throw new ForbiddenException('QR code has expired');
    }

    // Check feature flag for this type/branch
    const requiredFlag = FLAG_FOR_TYPE[record.type as QrCodeType];
    if (requiredFlag) {
      const enabled = await this.flags.isEnabled(record.branchId, requiredFlag);
      if (!enabled) {
        throw new ForbiddenException(
          `Feature '${requiredFlag}' is not enabled at this branch`,
        );
      }
    }

    const scanLog = await this.db.client.qrCodeScanLog.create({
      data: {
        qrCodeId: record.id,
        customerId: opts.customerId ?? null,
        userAgent: opts.userAgent ?? null,
        ipHash: opts.ipHash ?? null,
      },
    });

    return { qrCode: this.mapToDto(record), scanLogId: scanLog.id };
  }

  /** List QR codes for a branch. */
  async listForBranch(branchId: string): Promise<QrCodeDto[]> {
    const records = await this.db.client.qrCode.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: any) => this.mapToDto(r));
  }

  /** Deactivate a QR code. */
  async deactivate(id: string): Promise<QrCodeDto> {
    const record = await this.db.client.qrCode.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`QR code ${id} not found`);

    const updated = await this.db.client.qrCode.update({
      where: { id },
      data: { status: QrCodeStatus.INACTIVE },
    });
    return this.mapToDto(updated);
  }

  /** Get scan count for a QR code (last 30 days). */
  async getScanStats(id: string): Promise<{ total: number; last30Days: number }> {
    const record = await this.db.client.qrCode.findUnique({ where: { id }, select: { id: true } });
    if (!record) throw new NotFoundException(`QR code ${id} not found`);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, last30Days] = await Promise.all([
      this.db.client.qrCodeScanLog.count({ where: { qrCodeId: id } }),
      this.db.client.qrCodeScanLog.count({
        where: { qrCodeId: id, scannedAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return { total, last30Days };
  }
}
