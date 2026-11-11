import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller()
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  // ---------------------------------------------------------------------------
  // Customer-facing
  // ---------------------------------------------------------------------------

  /** Get own loyalty balance and tier. Creates account if first access. */
  @Get('customers/me/loyalty')
  @UseGuards(JwtAuthGuard)
  async getMyBalance(@Req() req: any) {
    return this.loyalty.getOrCreateAccount(req.user.sub);
  }

  /** List available rewards. Public. */
  @Get('loyalty/rewards')
  async listRewards() {
    return this.loyalty.listRewards();
  }

  /** Reserve a reward redemption. */
  @Post('customers/me/loyalty/redeem')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async reserveRedemption(
    @Req() req: any,
    @Body() body: { rewardId: string; orderId?: string | undefined },
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    return this.loyalty.reserveRedemption({
      customerId: req.user.sub,
      rewardId: body.rewardId,
      orderId: body.orderId,
      idempotencyKey: idempotencyKey ?? `${req.user.sub}-${body.rewardId}-${Date.now()}`,
    });
  }

  // ---------------------------------------------------------------------------
  // Admin / internal
  // ---------------------------------------------------------------------------

  /** Admin: get customer loyalty balance. */
  @Get('admin/loyalty/:customerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'HQ')
  async getCustomerBalance(@Param('customerId') customerId: string) {
    return this.loyalty.getBalance(customerId);
  }

  /** Admin: adjust points (manual correction). */
  @Post('admin/loyalty/:customerId/adjust')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HQ')
  @HttpCode(HttpStatus.NO_CONTENT)
  async adjustPoints(
    @Param('customerId') customerId: string,
    @Body() body: { points: number; note: string },
    @Req() req: any,
  ) {
    await this.loyalty.adjustPoints(customerId, body.points, body.note, req.user.sub);
  }

  /** Internal: commit a reservation (called by order service). */
  @Post('internal/loyalty/redemptions/:id/commit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async commitRedemption(@Param('id') id: string) {
    await this.loyalty.commitRedemption(id);
  }

  /** Internal: reverse a reservation (called on order cancellation). */
  @Post('internal/loyalty/redemptions/:id/reverse')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reverseRedemption(@Param('id') id: string) {
    await this.loyalty.reverseRedemption(id);
  }
}
