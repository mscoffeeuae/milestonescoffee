import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { QrService } from './qr.service.js';
import { QrCodeType, QrCodeStatus } from '@milestones/database';

function makeDb(overrides: { qrCode?: any; qrCodeScanLog?: any } = {}) {
  const baseQr = {
    create: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
  };
  return {
    client: {
      qrCode: { ...baseQr, ...(overrides['qrCode'] ?? {}) },
      qrCodeScanLog: {
        create: vi.fn().mockResolvedValue({ id: 'scan-1' }),
        count: vi.fn().mockResolvedValue(0),
        ...(overrides['qrCodeScanLog'] ?? {}),
      },
    },
  } as any;
}

function makeFlags(overrides: Record<string, boolean> = {}) {
  return {
    isEnabled: vi.fn().mockImplementation((_branchId: string, flag: string) =>
      Promise.resolve(overrides[flag] ?? false),
    ),
  } as any;
}

const mockQrRecord = {
  id: 'qr-1',
  branchId: 'branch-1',
  type: QrCodeType.TABLE_ORDER,
  status: QrCodeStatus.ACTIVE,
  token: 'abc123token',
  referenceId: 'T4',
  label: 'Table 4',
  expiresAt: null,
  createdAt: new Date(),
};

describe('QrService', () => {
  describe('createQrCode', () => {
    it('throws ForbiddenException when flag is disabled', async () => {
      const db = makeDb();
      const flags = makeFlags({ qr_ordering: false });
      const svc = new QrService(db, flags);
      await expect(
        svc.createQrCode({ branchId: 'branch-1', type: QrCodeType.TABLE_ORDER }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates QR code when flag enabled', async () => {
      const db = makeDb({
        qrCode: { create: vi.fn().mockResolvedValue(mockQrRecord) },
      });
      const flags = makeFlags({ qr_ordering: true });
      const svc = new QrService(db, flags);
      const result = await svc.createQrCode({ branchId: 'branch-1', type: QrCodeType.TABLE_ORDER });
      expect(result.type).toBe(QrCodeType.TABLE_ORDER);
      expect(db.client.qrCode.create).toHaveBeenCalledOnce();
    });

    it('creates TAKEAWAY_PICKUP without flag check (null gate)', async () => {
      const db = makeDb({
        qrCode: { create: vi.fn().mockResolvedValue({ ...mockQrRecord, type: QrCodeType.TAKEAWAY_PICKUP }) },
      });
      const flags = makeFlags({}); // no flags enabled
      const svc = new QrService(db, flags);
      const result = await svc.createQrCode({ branchId: 'branch-1', type: QrCodeType.TAKEAWAY_PICKUP });
      expect(result.type).toBe(QrCodeType.TAKEAWAY_PICKUP);
      expect(flags.isEnabled).not.toHaveBeenCalled();
    });
  });

  describe('resolveToken', () => {
    it('throws NotFoundException for unknown token', async () => {
      const db = makeDb();
      const flags = makeFlags();
      const svc = new QrService(db, flags);
      await expect(svc.resolveToken('bad-token', {})).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for INACTIVE QR', async () => {
      const db = makeDb({
        qrCode: {
          findUnique: vi.fn().mockResolvedValue({ ...mockQrRecord, status: QrCodeStatus.INACTIVE }),
        },
      });
      const flags = makeFlags({ qr_ordering: true });
      const svc = new QrService(db, flags);
      await expect(svc.resolveToken('abc123token', {})).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for expired QR', async () => {
      const pastDate = new Date(Date.now() - 1000);
      const db = makeDb({
        qrCode: {
          findUnique: vi.fn().mockResolvedValue({ ...mockQrRecord, expiresAt: pastDate }),
          update: vi.fn().mockResolvedValue({ ...mockQrRecord, status: QrCodeStatus.EXPIRED }),
        },
      });
      const flags = makeFlags({ qr_ordering: true });
      const svc = new QrService(db, flags);
      await expect(svc.resolveToken('abc123token', {})).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when flag disabled during resolve', async () => {
      const db = makeDb({
        qrCode: { findUnique: vi.fn().mockResolvedValue(mockQrRecord) },
      });
      const flags = makeFlags({ qr_ordering: false });
      const svc = new QrService(db, flags);
      await expect(svc.resolveToken('abc123token', {})).rejects.toThrow(ForbiddenException);
    });

    it('records scan log and returns QR code on success', async () => {
      const db = makeDb({
        qrCode: { findUnique: vi.fn().mockResolvedValue(mockQrRecord) },
        qrCodeScanLog: { create: vi.fn().mockResolvedValue({ id: 'scan-99' }) },
      });
      const flags = makeFlags({ qr_ordering: true });
      const svc = new QrService(db, flags);
      const result = await svc.resolveToken('abc123token', { customerId: 'cust-1' });
      expect(result.qrCode.id).toBe('qr-1');
      expect(result.scanLogId).toBe('scan-99');
      expect(db.client.qrCodeScanLog.create).toHaveBeenCalledOnce();
    });
  });

  describe('deactivate', () => {
    it('throws NotFoundException for unknown QR code', async () => {
      const db = makeDb();
      const flags = makeFlags();
      const svc = new QrService(db, flags);
      await expect(svc.deactivate('no-id')).rejects.toThrow(NotFoundException);
    });

    it('sets status to INACTIVE', async () => {
      const updatedRecord = { ...mockQrRecord, status: QrCodeStatus.INACTIVE };
      const db = makeDb({
        qrCode: {
          findUnique: vi.fn().mockResolvedValue(mockQrRecord),
          update: vi.fn().mockResolvedValue(updatedRecord),
        },
      });
      const flags = makeFlags();
      const svc = new QrService(db, flags);
      const result = await svc.deactivate('qr-1');
      expect(result.status).toBe(QrCodeStatus.INACTIVE);
    });
  });
});
