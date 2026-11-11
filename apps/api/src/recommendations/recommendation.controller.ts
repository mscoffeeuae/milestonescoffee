import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecommendationService } from './recommendation.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RecommendationEventType } from '@milestones/database';

@Controller()
export class RecommendationController {
  constructor(private readonly recommendations: RecommendationService) {}

  // ---------------------------------------------------------------------------
  // Customer-facing
  // ---------------------------------------------------------------------------

  /**
   * Record a behavioural event (view, add-to-cart, purchase, skip).
   * Always open to authenticated customers — builds recommendation history.
   */
  @Post('customers/me/events')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async recordEvent(
    @Req() req: any,
    @Body() body: {
      productId: string;
      branchId?: string | undefined;
      eventType: RecommendationEventType;
    },
  ) {
    return this.recommendations.recordEvent({
      customerId: req.user.sub,
      productId: body.productId,
      branchId: body.branchId,
      eventType: body.eventType,
    });
  }

  /**
   * Get personalised recommendations for the authenticated customer.
   * Requires 'recommendations' feature flag enabled for the branch.
   */
  @Get('customers/me/recommendations')
  @UseGuards(JwtAuthGuard)
  async getRecommendations(
    @Req() req: any,
    @Query('branchId') branchId: string,
    @Query('limit') limit?: string,
  ) {
    return this.recommendations.getRecommendations(
      req.user.sub,
      branchId,
      limit ? Math.min(parseInt(limit, 10), 50) : 10,
    );
  }

  /**
   * Get recently viewed products for the authenticated customer.
   */
  @Get('customers/me/recently-viewed')
  @UseGuards(JwtAuthGuard)
  async getRecentlyViewed(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.recommendations.getRecentlyViewed(
      req.user.sub,
      limit ? Math.min(parseInt(limit, 10), 50) : 10,
    );
  }
}
