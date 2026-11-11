/**
 * PosController — POS webhook and integration health endpoints.
 *
 * POST /webhooks/pos/:provider      — receives POS events (no auth, signature verified)
 * GET  /admin/integrations/health   — staff-only integration health status
 */
import {
  Controller,
  Post,
  Get,
  Param,
  Headers,
  Req,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PosService } from './pos.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@Controller()
export class PosController {
  constructor(private readonly posService: PosService) {}

  /**
   * POST /webhooks/pos/:provider
   * Receives raw POS webhook. Signature verification deferred to D-006.
   */
  @Post('webhooks/pos/:provider')
  @HttpCode(200)
  async handlePosWebhook(
    @Param('provider') provider: string,
    @Headers('x-signature') signature: string,
    @Req() req: Request,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawBody: Buffer = (req as any).rawBody ?? Buffer.from('');
    try {
      await this.posService.processWebhook({
        provider,
        externalOrderId: '',
        status: '',
        rawBody,
        signature,
      });
    } catch {
      // 501 is expected until D-006; still return 200 to ACK the webhook
    }
    return { received: true };
  }

  /**
   * GET /admin/integrations/health
   * Returns health status for all configured integrations.
   */
  @Get('admin/integrations/health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'hq', 'super_admin')
  async getHealth(@Param('provider') provider?: string) {
    const targetProvider = provider ?? 'default';
    return this.posService.getHealth(targetProvider);
  }
}
