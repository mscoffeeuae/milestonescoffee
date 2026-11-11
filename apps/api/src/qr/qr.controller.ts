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
  Headers,
} from '@nestjs/common';
import { QrService, CreateQrInput } from './qr.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { QrCodeType } from '@milestones/database';

@Controller()
export class QrController {
  constructor(private readonly qr: QrService) {}

  // ---------------------------------------------------------------------------
  // Public — QR token resolution
  // ---------------------------------------------------------------------------

  /**
   * Resolve a scanned QR token.
   * Public endpoint (unauthenticated scan); customerId optionally supplied.
   * Returns the QR code payload so the app knows what action to perform.
   */
  @Post('qr/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveToken(
    @Body() body: { token: string; customerId?: string | undefined },
    @Req() req: any,
    @Headers('user-agent') userAgent?: string,
  ) {
    // Extract IP hash from request (SHA-256 of forwarded IP — never store raw IP)
    const rawIp: string = (req.headers['x-forwarded-for'] as string) ?? req.ip ?? '';
    let ipHash: string | undefined;
    if (rawIp) {
      const { createHash } = await import('node:crypto');
      ipHash = createHash('sha256').update(rawIp).digest('hex');
    }

    return this.qr.resolveToken(body.token, {
      customerId: body.customerId,
      userAgent,
      ipHash,
    });
  }

  // ---------------------------------------------------------------------------
  // Admin — QR code management (MANAGER or HQ)
  // ---------------------------------------------------------------------------

  /** List QR codes for a branch. */
  @Get('admin/branches/:branchId/qr-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'HQ')
  async listForBranch(@Param('branchId') branchId: string) {
    return this.qr.listForBranch(branchId);
  }

  /** Create a new QR code for a branch. */
  @Post('admin/branches/:branchId/qr-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'HQ')
  @HttpCode(HttpStatus.CREATED)
  async createQrCode(
    @Param('branchId') branchId: string,
    @Body() body: {
      type: QrCodeType;
      referenceId?: string | undefined;
      label?: string | undefined;
      expiresAt?: string | undefined;
    },
  ) {
    const input: CreateQrInput = {
      branchId,
      type: body.type,
      referenceId: body.referenceId,
      label: body.label,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    };
    return this.qr.createQrCode(input);
  }

  /** Deactivate a QR code. */
  @Patch('admin/qr-codes/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'HQ')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id') id: string) {
    return this.qr.deactivate(id);
  }

  /** Get scan statistics for a QR code. */
  @Get('admin/qr-codes/:id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'HQ')
  async getScanStats(@Param('id') id: string) {
    return this.qr.getScanStats(id);
  }
}
