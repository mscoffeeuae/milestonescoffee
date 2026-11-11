import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { PromotionService } from './promotion.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotions: PromotionService) {}

  /** List active no-code promotions (public). */
  @Get()
  async listActive() {
    return this.promotions.listActive();
  }

  /** Validate a coupon code (authenticated — prevents enumeration). */
  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async validateCode(@Body() body: { code: string }) {
    return this.promotions.validateCode(body.code);
  }

  /** Apply a promotion to an order (authenticated). */
  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async applyPromotion(
    @Body() body: { promotionId: string; orderId: string; orderTotalFils: number; branchId: string },
    @Req() req: any,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    return this.promotions.applyPromotion({
      ...body,
      idempotencyKey: idempotencyKey ?? `${req.user.sub}-${body.orderId}-${body.promotionId}`,
    });
  }

  /** Admin: list all promotions including inactive. */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'HQ')
  async adminListAll() {
    return this.promotions.adminListAll();
  }
}
