import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { CartModule } from './cart/cart.module.js';

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
    // Infrastructure
    HealthModule,
  ],
})
export class AppModule {}
