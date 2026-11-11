/**
 * CorporateService — B2B enquiries, quotes, and account management.
 *
 * Flow:
 *   1. Prospect submits CorporateEnquiry (public form + PDPL consent)
 *   2. HQ staff review enquiry → createQuote (status=DRAFT)
 *   3. HQ staff finalise → sendQuote (status=SENT, email to prospect)
 *   4. Prospect (or staff on behalf) → acceptQuote (status=ACCEPTED)
 *   5. HQ creates CorporateAccount for the customer
 *
 * Quote versioning:
 *   @@unique([quoteNumber, version]) — HQ can issue a revised quote (v2, v3)
 *   without invalidating accepted/rejected history. Only the LATEST version
 *   should be used for acceptance.
 *
 * PDPL consent:
 *   consentEvidence field on CorporateEnquiry stores the event reference
 *   (e.g. form submission ID or timestamp+IP hash). Never overwritten.
 *
 * Email delivery:
 *   sendQuote fires a notification after $transaction (fire-and-forget).
 *   Actual email not implemented until notification provider is selected (D-008).
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface SubmitEnquiryInput {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  companyName: string;
  message: string;
  consentEvidence: string;
}

export interface EnquiryDto {
  id: string;
  contactName: string;
  contactEmail: string;
  companyName: string;
  status: string;
  createdAt: string;
}

export interface CreateQuoteInput {
  enquiryId: string;
  quoteNumber: string;
  lineItemsJson: unknown;
  totalFils: number;
  validUntil: Date;
}

export interface QuoteDto {
  id: string;
  quoteNumber: string;
  version: number;
  status: string;
  totalFils: number;
  validUntil: string;
  lineItemsJson: unknown;
  acceptedAt: string | null;
}

export interface CorporateAccountDto {
  id: string;
  nameEn: string;
  nameAr: string | null;
  contactName: string;
  contactEmail: string;
  isActive: boolean;
}

@Injectable()
export class CorporateService {
  constructor(private readonly db: DatabaseService) {}

  // ---------------------------------------------------------------------------
  // Enquiry
  // ---------------------------------------------------------------------------

  /** Public: submit a corporate enquiry (contact form). */
  async submitEnquiry(input: SubmitEnquiryInput): Promise<EnquiryDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enquiry: any = await this.db.client.corporateEnquiry.create({
      data: {
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        companyName: input.companyName,
        message: input.message,
        consentEvidence: input.consentEvidence,
        status: 'NEW',
      },
      select: {
        id: true,
        contactName: true,
        contactEmail: true,
        companyName: true,
        status: true,
        createdAt: true,
      },
    });

    return this.mapEnquiry(enquiry);
  }

  /** HQ: list all enquiries, optionally filtered by status. */
  async listEnquiries(options: { status?: string | undefined } = {}): Promise<EnquiryDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (options.status) where.status = options.status;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enquiries: any[] = await this.db.client.corporateEnquiry.findMany({
      where,
      select: {
        id: true,
        contactName: true,
        contactEmail: true,
        companyName: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }) ?? [];

    return enquiries.map(this.mapEnquiry);
  }

  /** HQ: get single enquiry with full details. */
  async getEnquiry(enquiryId: string): Promise<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enquiry: any = await this.db.client.corporateEnquiry.findUnique({
      where: { id: enquiryId },
      select: {
        id: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        companyName: true,
        message: true,
        status: true,
        createdAt: true,
        // consentEvidence intentionally NOT selected — PDPL internal use only
      },
    });

    if (!enquiry) throw new NotFoundException('Enquiry not found');
    return enquiry;
  }

  /** HQ: update enquiry status (e.g. NEW → IN_PROGRESS → CLOSED). */
  async updateEnquiryStatus(enquiryId: string, status: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any = await this.db.client.corporateEnquiry.findUnique({
      where: { id: enquiryId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Enquiry not found');

    await (this.db.client.corporateEnquiry as any).update({
      where: { id: enquiryId },
      data: { status },
    });
  }

  // ---------------------------------------------------------------------------
  // Quotes
  // ---------------------------------------------------------------------------

  /** HQ: create a new quote (DRAFT status). */
  async createQuote(input: CreateQuoteInput): Promise<QuoteDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any = await this.db.client.corporateEnquiry.findUnique({
      where: { id: input.enquiryId },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException('Enquiry not found');
    if (existing.status === 'CLOSED') {
      throw new UnprocessableEntityException('Cannot create quote for a closed enquiry');
    }

    // Calculate next version for this quoteNumber
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestVersion: any = await this.db.client.corporateQuote.findFirst({
      where: { quoteNumber: input.quoteNumber },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (latestVersion?.version ?? 0) + 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote: any = await this.db.client.corporateQuote.create({
      data: {
        enquiryId: input.enquiryId,
        quoteNumber: input.quoteNumber,
        version,
        status: 'DRAFT',
        lineItemsJson: input.lineItemsJson as any,
        totalFils: input.totalFils,
        validUntil: input.validUntil,
      },
      select: {
        id: true,
        quoteNumber: true,
        version: true,
        status: true,
        totalFils: true,
        validUntil: true,
        lineItemsJson: true,
        acceptedAt: true,
      },
    });

    return this.mapQuote(quote);
  }

  /** HQ: send a DRAFT quote to the prospect (status → SENT). */
  async sendQuote(quoteId: string): Promise<QuoteDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote: any = await this.db.client.corporateQuote.findUnique({
      where: { id: quoteId },
      select: {
        id: true,
        status: true,
        quoteNumber: true,
        version: true,
        totalFils: true,
        validUntil: true,
        lineItemsJson: true,
        acceptedAt: true,
        enquiry: {
          select: { contactEmail: true, contactName: true, companyName: true },
        },
      },
    });

    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'DRAFT') {
      throw new UnprocessableEntityException(`Quote is ${quote.status}, cannot send`);
    }

    return this.db.client.$transaction(async (tx: any) => {
      const updated = await tx.corporateQuote.update({
        where: { id: quoteId },
        data: { status: 'SENT' },
        select: {
          id: true, quoteNumber: true, version: true, status: true,
          totalFils: true, validUntil: true, lineItemsJson: true, acceptedAt: true,
        },
      });

      // ⚠ D-008 stub: email notification not implemented
      // TODO: notify(quote.enquiry.contactEmail, 'quote_sent', { quoteId, quoteNumber, totalFils })

      return this.mapQuote(updated);
    });
  }

  /** Accept a SENT quote. */
  async acceptQuote(quoteId: string): Promise<QuoteDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote: any = await this.db.client.corporateQuote.findUnique({
      where: { id: quoteId },
      select: { id: true, status: true, validUntil: true },
    });

    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'SENT') {
      throw new UnprocessableEntityException(`Quote is ${quote.status}, cannot accept`);
    }
    if (new Date(quote.validUntil) < new Date()) {
      throw new UnprocessableEntityException('Quote has expired');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated: any = await this.db.client.corporateQuote.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
      select: {
        id: true, quoteNumber: true, version: true, status: true,
        totalFils: true, validUntil: true, lineItemsJson: true, acceptedAt: true,
      },
    });

    return this.mapQuote(updated);
  }

  /** List quotes for an enquiry. */
  async listQuotesForEnquiry(enquiryId: string): Promise<QuoteDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any = await this.db.client.corporateEnquiry.findUnique({
      where: { id: enquiryId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Enquiry not found');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes: any[] = await this.db.client.corporateQuote.findMany({
      where: { enquiryId },
      select: {
        id: true, quoteNumber: true, version: true, status: true,
        totalFils: true, validUntil: true, lineItemsJson: true, acceptedAt: true,
      },
      orderBy: [{ quoteNumber: 'asc' }, { version: 'desc' }],
    }) ?? [];

    return quotes.map(this.mapQuote.bind(this));
  }

  // ---------------------------------------------------------------------------
  // Corporate Accounts
  // ---------------------------------------------------------------------------

  /** HQ: create corporate account (after quote accepted). */
  async createAccount(input: {
    nameEn: string;
    nameAr?: string | undefined;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    trn?: string | undefined;
  }): Promise<CorporateAccountDto> {
    // Check email uniqueness
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any = await this.db.client.corporateAccount.findFirst({
      where: { contactEmail: input.contactEmail },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Corporate account with this email already exists');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account: any = await this.db.client.corporateAccount.create({
      data: {
        nameEn: input.nameEn,
        nameAr: input.nameAr ?? null,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        trn: input.trn ?? null,
        isActive: true,
      },
      select: {
        id: true, nameEn: true, nameAr: true, contactName: true, contactEmail: true, isActive: true,
      },
    });

    return this.mapAccount(account);
  }

  /** HQ: list corporate accounts. */
  async listAccounts(): Promise<CorporateAccountDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accounts: any[] = await this.db.client.corporateAccount.findMany({
      select: {
        id: true, nameEn: true, nameAr: true, contactName: true, contactEmail: true, isActive: true,
      },
      orderBy: { nameEn: 'asc' },
    }) ?? [];

    return accounts.map(this.mapAccount.bind(this));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private mapEnquiry(e: any): EnquiryDto {
    return {
      id: e.id,
      contactName: e.contactName,
      contactEmail: e.contactEmail,
      companyName: e.companyName,
      status: e.status,
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : (e.createdAt ?? ''),
    };
  }

  private mapQuote(q: any): QuoteDto {
    return {
      id: q.id,
      quoteNumber: q.quoteNumber,
      version: q.version,
      status: q.status,
      totalFils: q.totalFils,
      validUntil: q.validUntil instanceof Date ? q.validUntil.toISOString() : (q.validUntil ?? ''),
      lineItemsJson: q.lineItemsJson,
      acceptedAt: q.acceptedAt
        ? (q.acceptedAt instanceof Date ? q.acceptedAt.toISOString() : q.acceptedAt)
        : null,
    };
  }

  private mapAccount(a: any): CorporateAccountDto {
    return {
      id: a.id,
      nameEn: a.nameEn,
      nameAr: a.nameAr ?? null,
      contactName: a.contactName,
      contactEmail: a.contactEmail,
      isActive: a.isActive,
    };
  }
}
