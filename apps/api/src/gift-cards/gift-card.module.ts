import { Module } from '@nestjs/common';
import { GiftCardController } from './gift-card.controller.js';
import { GiftCardService } from './gift-card.service.js';

@Module({
  controllers: [GiftCardController],
  providers: [GiftCardService],
  exports: [GiftCardService],
})
export class GiftCardModule {}
