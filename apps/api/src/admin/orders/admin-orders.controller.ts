/**
 * AdminOrdersController — staff order management endpoints.
 *
 * All routes require authentication. Branch-scoped staff (branchId in token)
 * are limited to their branch. HQ staff (no branchId) see all branches.
 *
 * GET  /admin/orders              — list orders (paginated, filterable)
 * GET  /admin/orders/:id          — order detail
 * POST /admin/orders/:id/accept   — CONFIRMED → ACCEPTED
 * POST /admin/orders/:id/prepare  — ACCEPTED → PREPARING
 * POST /admin/orders/:id/ready    — PREPARING → READY
 * POST /admin/orders/:id/complete — READY → COMPLETED
 * POST /admin/orders/:id/cancel   — cancel with reason
 */
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { AdminOrdersService } from './admin-orders.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/auth.types.js';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('staff', 'manager', 'hq', 'super_admin')
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) {}

  @Get()
  async listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.service.listOrders(user.branchId, {
      branchId,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getOrder(id, user.branchId);
  }

  @Post(':id/accept')
  @HttpCode(200)
  async acceptOrder(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.acceptOrder(id, user.id, user.branchId);
  }

  @Post(':id/prepare')
  @HttpCode(200)
  async startPreparing(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.startPreparing(id, user.id, user.branchId);
  }

  @Post(':id/ready')
  @HttpCode(200)
  async markReady(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.markReady(id, user.id, user.branchId);
  }

  @Post(':id/complete')
  @HttpCode(200)
  async completeOrder(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.completeOrder(id, user.id, user.branchId);
  }

  @Post(':id/cancel')
  @HttpCode(204)
  async cancelOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancelOrder(id, user.id, reason ?? 'staff_cancelled', user.branchId);
  }
}
