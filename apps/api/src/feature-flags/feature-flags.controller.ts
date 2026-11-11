import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { FeatureFlagsService, KNOWN_FLAGS, FeatureFlag } from './feature-flags.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller('admin/branches/:branchId/feature-flags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HQ')
export class FeatureFlagsController {
  constructor(private readonly flags: FeatureFlagsService) {}

  /** List all known flags for a branch. */
  @Get()
  async listFlags(@Param('branchId') branchId: string) {
    return this.flags.listForBranch(branchId);
  }

  /**
   * Enable or disable a feature flag for a branch.
   * Only HQ staff may mutate flags.
   */
  @Put(':flag')
  @HttpCode(HttpStatus.OK)
  async setFlag(
    @Param('branchId') branchId: string,
    @Param('flag') flag: string,
    @Body() body: { enabled: boolean },
    @Req() req: any,
  ) {
    // Validate flag name
    if (!(KNOWN_FLAGS as readonly string[]).includes(flag)) {
      return { error: `Unknown flag '${flag}'. Known flags: ${KNOWN_FLAGS.join(', ')}` };
    }
    return this.flags.setFlag(branchId, flag as FeatureFlag, body.enabled, req.user.sub);
  }
}
