/**
 * Subscription service — customer coffee bundle subscriptions.
 *
 * ⚠ D-011 STUB: Plan definitions (planId lookup, pricing, billing interval)
 * are deferred — pending Finance + Marketing approval of subscription product
 * catalogue. Plan IDs are stored as opaque strings.
 *
 * ⚠ D-012 STUB: Recurring billing (charge at nextBillingAt) is handled by
 * the BullMQ worker, not this service. This service only manages lifecycle
 * state; actual charging and cycle creation are worker responsibilities.
 *
 * Feature gate: 'subscriptions' flag must be enabled per branch before
 * customers at that branch can subscribe.
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service.js';

export interface CreateSubscriptionInput {
  customerId: string;
  planId: string;
  branchId: string;
  recurringConsent: boolean;
  nextBillingAt?: Date | undefined;
}

export interface SubscriptionDto {
  id: string;
  customerId: string;
  planId: string;
  status: string;
  recurringConsent: boolean;
  nextBillingAt: Date | null;
  createdAt: Date;
}

export interface SubscriptionCycleDto {
  id: string;
  subscriptionId: string;
  billingCycle: string;
  orderId: string | null;
  amountFils: number;
  billedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly db: DatabaseService,
    private readonly flags: FeatureFlagsService,
  ) {}

  private mapDto(record: any): SubscriptionDto {
    return {
      id: record.id,
      customerId: record.customerId,
      planId: record.planId,
      status: record.status,
      recurringConsent: record.recurringConsent,
      nextBillingAt: record.nextBillingAt ?? null,
      createdAt: record.createdAt,
    };
  }

  private mapCycleDto(record: any): SubscriptionCycleDto {
    return {
      id: record.id,
      subscriptionId: record.subscriptionId,
      billingCycle: record.billingCycle,
      orderId: record.orderId ?? null,
      amountFils: record.amountFils,
      billedAt: record.billedAt ?? null,
      createdAt: record.createdAt,
    };
  }

  /**
   * Create a subscription for a customer.
   * Requires recurringConsent = true (PDPL + UAE consumer protection).
   * Requires 'subscriptions' feature flag enabled for the branch.
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionDto> {
    if (!input.recurringConsent) {
      throw new BadRequestException('recurringConsent must be true to create a subscription');
    }

    // Feature gate
    const enabled = await this.flags.isEnabled(input.branchId, 'subscriptions');
    if (!enabled) {
      throw new ForbiddenException(
        `Subscriptions are not enabled for branch ${input.branchId}`,
      );
    }

    // One active subscription per customer per plan
    const existing = await this.db.client.subscription.findFirst({
      where: {
        customerId: input.customerId,
        planId: input.planId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        `Customer already has an active subscription for plan ${input.planId}`,
      );
    }

    const record = await this.db.client.subscription.create({
      data: {
        customerId: input.customerId,
        planId: input.planId,
        status: 'ACTIVE',
        recurringConsent: true,
        nextBillingAt: input.nextBillingAt ?? null,
      },
    });

    return this.mapDto(record);
  }

  /** List all subscriptions for a customer. */
  async listForCustomer(customerId: string): Promise<SubscriptionDto[]> {
    const records = await this.db.client.subscription.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: any) => this.mapDto(r));
  }

  /** Get a subscription by id. Customer must own it. */
  async getSubscription(id: string, customerId: string): Promise<SubscriptionDto> {
    const record = await this.db.client.subscription.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Subscription ${id} not found`);
    if (record.customerId !== customerId) throw new NotFoundException(`Subscription ${id} not found`);
    return this.mapDto(record);
  }

  /**
   * Pause a subscription.
   * Only ACTIVE subscriptions can be paused.
   */
  async pauseSubscription(id: string, customerId: string): Promise<SubscriptionDto> {
    const record = await this.db.client.subscription.findUnique({ where: { id } });
    if (!record || record.customerId !== customerId) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }
    if (record.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot pause a subscription in status '${record.status}'`);
    }

    const updated = await this.db.client.subscription.update({
      where: { id },
      data: { status: 'PAUSED' },
    });
    return this.mapDto(updated);
  }

  /**
   * Resume a paused subscription.
   */
  async resumeSubscription(id: string, customerId: string): Promise<SubscriptionDto> {
    const record = await this.db.client.subscription.findUnique({ where: { id } });
    if (!record || record.customerId !== customerId) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }
    if (record.status !== 'PAUSED') {
      throw new BadRequestException(`Cannot resume a subscription in status '${record.status}'`);
    }

    const updated = await this.db.client.subscription.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
    return this.mapDto(updated);
  }

  /**
   * Cancel a subscription.
   * ACTIVE or PAUSED → CANCELLED. Cancelled is terminal.
   */
  async cancelSubscription(id: string, customerId: string): Promise<SubscriptionDto> {
    const record = await this.db.client.subscription.findUnique({ where: { id } });
    if (!record || record.customerId !== customerId) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }
    if (record.status === 'CANCELLED') {
      throw new BadRequestException('Subscription is already cancelled');
    }
    if (record.status === 'EXPIRED') {
      throw new BadRequestException('Cannot cancel an expired subscription');
    }

    const updated = await this.db.client.subscription.update({
      where: { id },
      data: { status: 'CANCELLED', nextBillingAt: null },
    });
    return this.mapDto(updated);
  }

  /** List billing cycles for a subscription. */
  async listCycles(id: string, customerId: string): Promise<SubscriptionCycleDto[]> {
    const sub = await this.db.client.subscription.findUnique({
      where: { id },
      select: { customerId: true },
    });
    if (!sub || sub.customerId !== customerId) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }

    const records = await this.db.client.subscriptionCycle.findMany({
      where: { subscriptionId: id },
      orderBy: { billingCycle: 'desc' },
    });
    return records.map((r: any) => this.mapCycleDto(r));
  }

  // ---------------------------------------------------------------------------
  // Admin / internal operations
  // ---------------------------------------------------------------------------

  /** Admin: list all subscriptions (paginated). */
  async adminListAll(opts: { status?: string | undefined; take?: number; skip?: number } = {}): Promise<SubscriptionDto[]> {
    const records = await this.db.client.subscription.findMany({
      where: opts.status ? { status: opts.status } : {},
      orderBy: { createdAt: 'desc' },
      take: opts.take ?? 50,
      skip: opts.skip ?? 0,
    });
    return records.map((r: any) => this.mapDto(r));
  }

  /**
   * Internal: record a billing cycle (called by worker after charge succeeds).
   * @@unique([subscriptionId, billingCycle]) prevents duplicate charges.
   */
  async recordCycle(
    subscriptionId: string,
    billingCycle: string,
    amountFils: number,
    orderId?: string | undefined,
  ): Promise<SubscriptionCycleDto> {
    const record = await this.db.client.subscriptionCycle.create({
      data: {
        subscriptionId,
        billingCycle,
        amountFils,
        orderId: orderId ?? null,
        billedAt: new Date(),
      },
    });
    return this.mapCycleDto(record);
  }
}
