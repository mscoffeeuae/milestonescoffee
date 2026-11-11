import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller.js';
import { RecommendationService } from './recommendation.service.js';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module.js';

@Module({
  imports: [FeatureFlagsModule],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
