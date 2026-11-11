/**
 * GiftCardController — gift card management endpoints.
 *
 * POST /gift-cards              — issue (manager+)
 * GET  /gift-cards/balance      — balance lookup by code (authenticated)
 * POST /gift-cards/redeem       — redeem (authenticated; Idempotency-Key required)
 * POST /gift-cards/:id/void     — void (manager+)
 */
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  HttpCode,
  UseGuards,
  UnprocessableEntityException,
} from '@nestjs/common';
import { GiftCardService } from './gift-card.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { IssueGiftCardInput, RedeemGiftCardInput } from './gift-card.types.js';

@Controller('gift-cards')
export class GiftCardController {
  constructor(private readonly service: GiftCardService) {}

  /**
   * POST /gift-cards — issue a new gift card.
   * Requires manager or higher role.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'hq', 'super_admin')
  issue(@Body() body: IssueGiftCardInput) {
    return this.service.issue(body);
  }

  /**
   * POST /gift-cards/balance — look up balance by plaintext code.
   * Public endpoint: no auth required (code IS the credential).
   */
  @Post('balance')
  @HttpCode(200)
  getBalance(@Body('code') code: string) {
    if (!code) throw new UnprocessableEntityException('code is required');
    return this.service.getBalance(code);
  }

  /**
   * POST /gift-cards/redeem — redeem gift card amount.
   * Requires authentication + Idempotency-Key header.
   */
  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  redeem(
    @Body() body: Omit<RedeemGiftCardInput, 'idempotencyKey'>,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    if (!idempotencyKey) {
      throw new UnprocessableEntityException('Idempotency-Key header is required');
    }
    return this.service.redeem({ ...body, idempotencyKey });
  }

  /**
   * POST /gift-cards/:id/void — void a gift card.
   * Requires manager or higher role.
   */
  @Post(':id/void')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'hq', 'super_admin')
  @HttpCode(204)
  void(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.void(id, reason ?? 'admin_void', user.id);
  }
}
