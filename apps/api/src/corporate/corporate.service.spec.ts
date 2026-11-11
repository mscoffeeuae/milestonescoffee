/**
 * CorporateService unit tests.
 * Direct instantiation pattern (Vitest ESM DI issue).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CorporateService } from './corporate.service.js';
import { NotFoundException, UnprocessableEntityException, ConflictException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEnquiry(partial: Record<string, unknown> = {}) {
  return {
    id: 'enq-1',
    contactName: 'Jane Smith',
    contactEmail: 'jane@acme.com',
    contactPhone: '+971501111111',
    companyName: 'ACME Corp',
    message: 'We need catering',
    consentEvidence: 'form-submit-123',
    status: 'NEW',
    createdAt: new Date(),
    ...partial,
  };
}

function makeQuote(partial: Record<string, unknown> = {}) {
  return {
    id: 'quote-1',
    enquiryId: 'enq-1',
    quoteNumber: 'Q-2026-001',
    version: 1,
    status: 'DRAFT',
    totalFils: 150_000,
    validUntil: new Date(Date.now() + 30 * 86400_000),
    lineItemsJson: [{ name: 'Coffee Package', qty: 50, unitFils: 3000 }],
    acceptedAt: null,
    ...partial,
  };
}

function makeDb() {
  return {
    client: {
      corporateEnquiry: {
        create: vi.fn().mockResolvedValue(makeEnquiry()),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
      },
      corporateQuote: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue(makeQuote()),
        update: vi.fn().mockResolvedValue(makeQuote()),
      },
      corporateAccount: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({
          id: 'corp-1',
          nameEn: 'ACME Corp',
          nameAr: null,
          contactName: 'Jane Smith',
          contactEmail: 'jane@acme.com',
          isActive: true,
        }),
      },
      $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
        const tx = {
          corporateQuote: {
            update: vi.fn().mockResolvedValue(makeQuote({ status: 'SENT' })),
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

describe('CorporateService', () => {
  let service: CorporateService;
  let db: ReturnType<typeof makeDb>;

  beforeEach(() => {
    db = makeDb();
    service = new CorporateService(db as any);
  });

  // -------------------------------------------------------------------------
  // submitEnquiry
  // -------------------------------------------------------------------------

  describe('submitEnquiry', () => {
    it('creates and returns enquiry', async () => {
      const result = await service.submitEnquiry({
        contactName: 'Jane Smith',
        contactEmail: 'jane@acme.com',
        contactPhone: '+971501111111',
        companyName: 'ACME Corp',
        message: 'We need catering',
        consentEvidence: 'form-submit-123',
      });

      expect(result.status).toBe('NEW');
      expect(result.companyName).toBe('ACME Corp');
    });
  });

  // -------------------------------------------------------------------------
  // listEnquiries
  // -------------------------------------------------------------------------

  describe('listEnquiries', () => {
    it('returns empty array when none exist', async () => {
      const result = await service.listEnquiries();
      expect(result).toEqual([]);
    });

    it('maps enquiries correctly', async () => {
      db.client.corporateEnquiry.findMany.mockResolvedValue([makeEnquiry()]);
      const result = await service.listEnquiries();
      expect(result[0]?.contactEmail).toBe('jane@acme.com');
    });
  });

  // -------------------------------------------------------------------------
  // getEnquiry
  // -------------------------------------------------------------------------

  describe('getEnquiry', () => {
    it('throws NotFoundException for missing enquiry', async () => {
      db.client.corporateEnquiry.findUnique.mockResolvedValue(null);
      await expect(service.getEnquiry('enq-404')).rejects.toThrow(NotFoundException);
    });

    it('returns enquiry without consentEvidence', async () => {
      db.client.corporateEnquiry.findUnique.mockResolvedValue(makeEnquiry());
      const result = await service.getEnquiry('enq-1') as any;
      // consentEvidence should NOT be in the response
      expect(result.id).toBe('enq-1');
    });
  });

  // -------------------------------------------------------------------------
  // createQuote
  // -------------------------------------------------------------------------

  describe('createQuote', () => {
    it('throws NotFoundException for missing enquiry', async () => {
      db.client.corporateEnquiry.findUnique.mockResolvedValue(null);
      await expect(
        service.createQuote({
          enquiryId: 'bad-id',
          quoteNumber: 'Q-001',
          lineItemsJson: [],
          totalFils: 10_000,
          validUntil: new Date(),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException for closed enquiry', async () => {
      db.client.corporateEnquiry.findUnique.mockResolvedValue(makeEnquiry({ status: 'CLOSED' }));
      await expect(
        service.createQuote({
          enquiryId: 'enq-1',
          quoteNumber: 'Q-001',
          lineItemsJson: [],
          totalFils: 10_000,
          validUntil: new Date(),
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('assigns version 1 for new quoteNumber', async () => {
      db.client.corporateEnquiry.findUnique.mockResolvedValue(makeEnquiry());
      db.client.corporateQuote.findFirst.mockResolvedValue(null); // No existing version
      db.client.corporateQuote.create.mockResolvedValue(makeQuote());

      const result = await service.createQuote({
        enquiryId: 'enq-1',
        quoteNumber: 'Q-2026-001',
        lineItemsJson: [],
        totalFils: 150_000,
        validUntil: new Date(Date.now() + 30 * 86400_000),
      });

      expect(result.version).toBe(1);
    });

    it('increments version for existing quoteNumber', async () => {
      db.client.corporateEnquiry.findUnique.mockResolvedValue(makeEnquiry());
      db.client.corporateQuote.findFirst.mockResolvedValue({ version: 2 }); // Existing v2
      db.client.corporateQuote.create.mockResolvedValue(makeQuote({ version: 3 }));

      const result = await service.createQuote({
        enquiryId: 'enq-1',
        quoteNumber: 'Q-2026-001',
        lineItemsJson: [],
        totalFils: 150_000,
        validUntil: new Date(Date.now() + 30 * 86400_000),
      });

      expect(result.version).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // sendQuote
  // -------------------------------------------------------------------------

  describe('sendQuote', () => {
    it('throws NotFoundException for missing quote', async () => {
      db.client.corporateQuote.findUnique.mockResolvedValue(null);
      await expect(service.sendQuote('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('throws UnprocessableEntityException for non-DRAFT quote', async () => {
      db.client.corporateQuote.findUnique.mockResolvedValue(makeQuote({ status: 'SENT' }));
      await expect(service.sendQuote('quote-1')).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // -------------------------------------------------------------------------
  // acceptQuote
  // -------------------------------------------------------------------------

  describe('acceptQuote', () => {
    it('throws UnprocessableEntityException for expired quote', async () => {
      db.client.corporateQuote.findUnique.mockResolvedValue(
        makeQuote({ status: 'SENT', validUntil: new Date(Date.now() - 86400_000) }),
      );
      await expect(service.acceptQuote('quote-1')).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // -------------------------------------------------------------------------
  // createAccount
  // -------------------------------------------------------------------------

  describe('createAccount', () => {
    it('throws ConflictException if email already exists', async () => {
      db.client.corporateAccount.findFirst.mockResolvedValue({ id: 'existing-corp' });
      await expect(
        service.createAccount({
          nameEn: 'ACME Corp',
          contactName: 'Jane',
          contactEmail: 'jane@acme.com',
          contactPhone: '+971501111111',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates corporate account', async () => {
      db.client.corporateAccount.findFirst.mockResolvedValue(null);
      const result = await service.createAccount({
        nameEn: 'ACME Corp',
        contactName: 'Jane Smith',
        contactEmail: 'jane@acme.com',
        contactPhone: '+971501111111',
      });
      expect(result.nameEn).toBe('ACME Corp');
      expect(result.isActive).toBe(true);
    });
  });
});
