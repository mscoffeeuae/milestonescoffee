import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { CartModule } from './cart/cart.module.js';
import { CheckoutModule } from './checkout/checkout.module.js';
import { PaymentModule } from './payments/payment.module.js';
import { AdminOrdersModule } from './admin/orders/admin-orders.module.js';
import { PosModule } from './pos/pos.module.js';
import { NotificationModule } from './notifications/notification.module.js';

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
    // Staff order management: state machine, branch-scoped ops (Prompt 8)
    AdminOrdersModule,
    // POS adapter stub — D-003/D-006 pending (Prompt 8)
    PosModule,
    // Notification delivery records — worker handles actual sending (Prompt 8)
    NotificationModule,
    // Infrastructure
    HealthModule,
  ],
})
export class AppModule {}
