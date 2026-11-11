import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { CartModule } from './cart/cart.module.js';
import { CheckoutModule } from './checkout/checkout.module.js';
import { PaymentModule } from './payments/payment.module.js';

@Module({
  imports: [
    // DatabaseModule is @Global — provides DatabaseService to all feature modules.
    DatabaseModule,
    // Auth stubs (D-004 pending).
    AuthModule,
    // Public catalog: branches + menu
    CatalogModule,
    // Pricing: fills→AED computation (no floating-point)
    PricingModule,
    // Cart: guest and customer cart lifecycle
    CartModule,
    // Checkout: quote creation + order placement (Prompt 7)
    CheckoutModule,
    // Payments: gateway stub + refunds (Prompt 7; D-005 pending)
    PaymentModule,
    // Infrastructure
    HealthModule,
  ],
})
export class AppModule {}
