/**
 * CartModule — shopping cart lifecycle management.
 *
 * Guest carts: identified by a hashed high-entropy token (never the raw token).
 * Customer carts: identified by customerId after OTP auth (Prompt 7).
 *
 * Cart merging (guest → customer) is in Prompt 7 (requires auth).
 * Checkout quote generation and order creation are in Prompt 7.
 */
import { Module } from '@nestjs/common';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';
import { PricingModule } from '../pricing/pricing.module.js';

@Module({
  imports: [PricingModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
