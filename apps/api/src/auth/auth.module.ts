/**
 * AuthModule — identity and authorization integration.
 *
 * Phase 1: Stubs only. Actual OTP and OAuth providers are behind decision D-004
 * (identity provider selection) in docs/DECISIONS.md. The interfaces and guard
 * contracts are locked so feature modules can depend on them now.
 *
 * Customer path : OTP via phone (UAE +971) → JWT access token + refresh token
 * Staff path    : OAuth / SAML via chosen IdP → JWT + RBAC role claims
 *
 * All tokens are short-lived (15 min access, 7 day refresh).
 * Refresh tokens are stored hashed in customer/staff records (not in DB yet —
 * see Prompt 7 for session table). Until then the stub always returns 501.
 */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
