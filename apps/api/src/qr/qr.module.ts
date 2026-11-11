import { Module } from '@nestjs/common';
import { QrController } from './qr.controller.js';
import { QrService } from './qr.service.js';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module.js';

@Module({
  imports: [FeatureFlagsModule],
  controllers: [QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
