/**
 * CustomerService — customer profile and account management.
 *
 * Authentication is managed by D-004 (external provider).
 * This service manages the customer record AFTER the JWT is validated —
 * profile data, addresses, consents, and order history lookups.
 *
 * Data-ownership rules:
 *   - Customers can only access/modify their OWN records.
 *   - Staff/HQ can read customer records for support purposes.
 *   - Deletion is soft-delete with PDPL/GDPR retention schedule.
 *   - Consent is append-only — never overwrite; always add a new row.
 *
 * Phone numbers are stored in E.164 format only. Display formatting
 * (e.g. +971 50 123 4567) is a frontend concern.
 */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  CustomerProfileDto,
  UpdateProfileInput,
  CustomerAddressDto,
  CreateAddressInput,
  UpdateAddressInput,
  ConsentInput,
} from './customer.types.js';

@Injectable()
export class CustomerService {
  constructor(private readonly db: DatabaseService) {}

  // ---------------------------------------------------------------------------
  // Profile
  // ---------------------------------------------------------------------------

  async getProfile(customerId: string): Promise<CustomerProfileDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customer: any = await this.db.client.customer.findUnique({
      where: { id: customerId, deletedAt: null },
      select: { id: true, name: true, email: true, phoneE164: true, locale: true, createdAt: true },
    });

    if (!customer) throw new NotFoundException('Customer not found');

    return {
      id: customer.id,
      name: customer.name ?? null,
      email: customer.email ?? null,
      phoneE164: customer.phoneE164 ?? null,
      locale: (customer.locale ?? 'en') as 'en' | 'ar',
      createdAt: customer.createdAt?.toISOString() ?? '',
    };
  }

  async updateProfile(customerId: string, input: UpdateProfileInput): Promise<CustomerProfileDto> {
    // Email uniqueness check (if email is being changed)
    if (input.email) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing: any = await this.db.client.customer.findFirst({
        where: { email: input.email, deletedAt: null, NOT: { id: customerId } },
        select: { id: true },
      });
      if (existing) throw new ConflictException('Email already in use by another account');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated: any = await this.db.client.customer.update({
      where: { id: customerId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.locale !== undefined ? { locale: input.locale } : {}),
      },
      select: { id: true, name: true, email: true, phoneE164: true, locale: true, createdAt: true },
    });

    return {
      id: updated.id,
      name: updated.name ?? null,
      email: updated.email ?? null,
      phoneE164: updated.phoneE164 ?? null,
      locale: (updated.locale ?? 'en') as 'en' | 'ar',
      createdAt: updated.createdAt?.toISOString() ?? '',
    };
  }

  // ---------------------------------------------------------------------------
  // Addresses
  // ---------------------------------------------------------------------------

  async listAddresses(customerId: string): Promise<CustomerAddressDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addresses: any[] = await this.db.client.customerAddress.findMany({
      where: { customerId },
      select: {
        id: true, label: true, line1: true, line2: true,
        city: true, emirate: true, country: true, isDefault: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    }) ?? [];

    return addresses.map((a) => ({
      id: a.id,
      label: a.label ?? null,
      line1: a.line1,
      line2: a.line2 ?? null,
      city: a.city,
      emirate: a.emirate,
      country: a.country,
      isDefault: a.isDefault,
    }));
  }

  async createAddress(customerId: string, input: CreateAddressInput): Promise<CustomerAddressDto> {
    return this.db.client.$transaction(async (tx: any) => {
      if (input.isDefault) {
        // Clear existing default
        await tx.customerAddress.updateMany({
          where: { customerId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const addr = await tx.customerAddress.create({
        data: {
          customerId,
          label: input.label ?? null,
          line1: input.line1,
          line2: input.line2 ?? null,
          city: input.city,
          emirate: input.emirate,
          country: input.country ?? 'AE',
          isDefault: input.isDefault ?? false,
        },
        select: {
          id: true, label: true, line1: true, line2: true,
          city: true, emirate: true, country: true, isDefault: true,
        },
      });

      return {
        id: addr.id,
        label: addr.label ?? null,
        line1: addr.line1,
        line2: addr.line2 ?? null,
        city: addr.city,
        emirate: addr.emirate,
        country: addr.country,
        isDefault: addr.isDefault,
      };
    });
  }

  async updateAddress(
    customerId: string,
    addressId: string,
    input: UpdateAddressInput,
  ): Promise<CustomerAddressDto> {
    return this.db.client.$transaction(async (tx: any) => {
      const existing = await tx.customerAddress.findFirst({
        where: { id: addressId, customerId },
        select: { id: true },
      });
      if (!existing) throw new NotFoundException('Address not found');

      if (input.isDefault) {
        await tx.customerAddress.updateMany({
          where: { customerId, isDefault: true, NOT: { id: addressId } },
          data: { isDefault: false },
        });
      }

      const addr = await tx.customerAddress.update({
        where: { id: addressId },
        data: {
          ...(input.label !== undefined ? { label: input.label } : {}),
          ...(input.line1 !== undefined ? { line1: input.line1 } : {}),
          ...(input.line2 !== undefined ? { line2: input.line2 } : {}),
          ...(input.city !== undefined ? { city: input.city } : {}),
          ...(input.emirate !== undefined ? { emirate: input.emirate } : {}),
          ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        },
        select: {
          id: true, label: true, line1: true, line2: true,
          city: true, emirate: true, country: true, isDefault: true,
        },
      });

      return {
        id: addr.id,
        label: addr.label ?? null,
        line1: addr.line1,
        line2: addr.line2 ?? null,
        city: addr.city,
        emirate: addr.emirate,
        country: addr.country,
        isDefault: addr.isDefault,
      };
    });
  }

  async deleteAddress(customerId: string, addressId: string): Promise<void> {
    const existing = await (this.db.client.customerAddress as any).findFirst({
      where: { id: addressId, customerId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Address not found');
    await (this.db.client.customerAddress as any).delete({ where: { id: addressId } });
  }

  // ---------------------------------------------------------------------------
  // Order history (read-only via CustomerService — write path is CheckoutService)
  // ---------------------------------------------------------------------------

  async listOrders(
    customerId: string,
    options: { limit?: number | undefined; cursor?: string | undefined } = {},
  ): Promise<{ orders: unknown[]; nextCursor: string | null }> {
    const limit = Math.min(options.limit ?? 20, 50);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { customerId };
    if (options.cursor) where.id = { lt: options.cursor };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders: any[] = await this.db.client.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        serviceType: true,
        totalFils: true,
        branchId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    }) ?? [];

    const hasMore = orders.length > limit;
    const page = hasMore ? orders.slice(0, limit) : orders;
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

    return { orders: page, nextCursor };
  }

  // ---------------------------------------------------------------------------
  // Consent (append-only per PDPL)
  // ---------------------------------------------------------------------------

  async recordConsent(customerId: string, input: ConsentInput): Promise<void> {
    await (this.db.client.customerConsent as any).create({
      data: {
        customerId,
        consentType: input.consentType,
        granted: input.granted,
        evidenceRef: input.evidenceRef,
        occurredAt: new Date(),
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Account deletion (PDPL/GDPR schedule)
  // ---------------------------------------------------------------------------

  async requestDeletion(customerId: string): Promise<{ scheduledFor: string }> {
    // Retain for 90 days per business requirement (adjust once D-012 resolved)
    const RETENTION_DAYS = 90;
    const scheduledFor = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000);

    await (this.db.client.customerDeletionRequest as any).create({
      data: {
        customerId,
        requestedAt: new Date(),
        scheduledFor,
        retentionNote: 'Standard 90-day retention — pending D-012 legal review',
      },
    });

    return { scheduledFor: scheduledFor.toISOString() };
  }
}
