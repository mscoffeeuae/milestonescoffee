import { Module } from '@nestjs/common';
import { CorporateService } from './corporate.service.js';
import { CorporateController } from './corporate.controller.js';

@Module({
  controllers: [CorporateController],
  providers: [CorporateService],
  exports: [CorporateService],
})
export class CorporateModule {}
