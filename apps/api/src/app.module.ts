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
import { CustomerModule } from './customers/customer.module.js';
import { GiftCardModule } from './gift-cards/gift-card.module.js';
import { ShopModule } from './shop/shop.module.js';
import { LoyaltyModule } from './loyalty/loyalty.module.js';
import { PromotionModule } from './promotions/promotion.module.js';
import { CorporateModule } from './corporate/corporate.module.js';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module.js';
import { QrModule } from './qr/qr.module.js';
import { SubscriptionModule } from './subscriptions/subscription.module.js';
import { RecommendationModule } from './recommendations/recommendation.module.js';

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
    // Customer profile, addresses, order history (Prompt 9)
    CustomerModule,
    // Gift card issuance, balance, redemption (Prompt 9; D-010 pending)
    GiftCardModule,
    // Online retail shop — merchandise, beans, equipment (Prompt 9)
    ShopModule,
    // Loyalty: points earn/redeem, rewards (Prompt 10; D-009 pending)
    LoyaltyModule,
    // Promotions: coupon validation + order discounts (Prompt 10; D-009 pending)
    PromotionModule,
    // Corporate portal: enquiries, quotes, accounts (Prompt 10)
    CorporateModule,
    // Feature flags: per-branch on/off switches (Prompt 11)
    FeatureFlagsModule,
    // QR codes: table-side, loyalty check-in, promotions (Prompt 11; flag-gated)
    QrModule,
    // Subscriptions: coffee bundle plans, billing cycles (Prompt 11; D-011/D-012 pending)
    SubscriptionModule,
    // Recommendations: behavioural events + popular items (Prompt 11; D-013 pending)
    RecommendationModule,
    // Infrastructure
    HealthModule,
  ],
})
export class AppModule {}
