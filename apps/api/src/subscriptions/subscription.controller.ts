import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller()
export class SubscriptionController {
  constructor(private readonly subscriptions: SubscriptionService) {}

  // ---------------------------------------------------------------------------
  // Customer-facing
  // ---------------------------------------------------------------------------

  /** List my subscriptions. */
  @Get('customers/me/subscriptions')
  @UseGuards(JwtAuthGuard)
  async listMySubscriptions(@Req() req: any) {
    return this.subscriptions.listForCustomer(req.user.sub);
  }

  /**
   * Subscribe to a plan.
   * recurringConsent is required (true) — explicit consent per UAE consumer rules.
   */
  @Post('customers/me/subscriptions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createSubscription(
    @Req() req: any,
    @Body() body: {
      planId: string;
      branchId: string;
      recurringConsent: boolean;
      nextBillingAt?: string | undefined;
    },
  ) {
    return this.subscriptions.createSubscription({
      customerId: req.user.sub,
      planId: body.planId,
      branchId: body.branchId,
      recurringConsent: body.recurringConsent,
      nextBillingAt: body.nextBillingAt ? new Date(body.nextBillingAt) : undefined,
    });
  }

  /** Get a specific subscription. */
  @Get('customers/me/subscriptions/:id')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Param('id') id: string, @Req() req: any) {
    return this.subscriptions.getSubscription(id, req.user.sub);
  }

  /** Pause a subscription. */
  @Patch('customers/me/subscriptions/:id/pause')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async pauseSubscription(@Param('id') id: string, @Req() req: any) {
    return this.subscriptions.pauseSubscription(id, req.user.sub);
  }

  /** Resume a paused subscription. */
  @Patch('customers/me/subscriptions/:id/resume')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resumeSubscription(@Param('id') id: string, @Req() req: any) {
    return this.subscriptions.resumeSubscription(id, req.user.sub);
  }

  /** Cancel a subscription. */
  @Patch('customers/me/subscriptions/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@Param('id') id: string, @Req() req: any) {
    return this.subscriptions.cancelSubscription(id, req.user.sub);
  }

  /** List billing cycles for a subscription. */
  @Get('customers/me/subscriptions/:id/cycles')
  @UseGuards(JwtAuthGuard)
  async listCycles(@Param('id') id: string, @Req() req: any) {
    return this.subscriptions.listCycles(id, req.user.sub);
  }

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  /** Admin: list all subscriptions. */
  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HQ')
  async adminListAll(
    @Query('status') status?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const opts: { status?: string; take?: number; skip?: number } = {};
    if (status !== undefined) opts.status = status;
    if (take !== undefined) opts.take = parseInt(take, 10);
    if (skip !== undefined) opts.skip = parseInt(skip, 10);
    return this.subscriptions.adminListAll(opts);
  }

  // ---------------------------------------------------------------------------
  // Internal — called by worker after billing
  // ---------------------------------------------------------------------------

  /** Internal: record a billing cycle after payment is confirmed. */
  @Post('internal/subscriptions/:id/cycles')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async recordCycle(
    @Param('id') subscriptionId: string,
    @Body() body: {
      billingCycle: string;
      amountFils: number;
      orderId?: string | undefined;
    },
  ) {
    return this.subscriptions.recordCycle(
      subscriptionId,
      body.billingCycle,
      body.amountFils,
      body.orderId,
    );
  }
}
