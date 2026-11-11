import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller.js';
import { CheckoutService } from './checkout.service.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { CartModule } from '../cart/cart.module.js';

@Module({
  imports: [CatalogModule, PricingModule, CartModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
