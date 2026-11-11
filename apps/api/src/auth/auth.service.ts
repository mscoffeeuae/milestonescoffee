/**
 * AuthService — identity and token issuance stubs.
 *
 * All methods return NotImplementedException (501) until the identity provider
 * decision (D-004) is made and the OTP gateway is wired.
 *
 * The interfaces are locked — downstream services and guards can be written now.
 */
import { Injectable, NotImplementedException, Logger } from '@nestjs/common';
import type {
  OtpSendDto,
  OtpVerifyDto,
  AuthTokensDto,
  JwtPayload,
  AuthenticatedUser,
} from './auth.types.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /**
   * Send a one-time password to the given phone number.
   *
   * @stub D-004 — OTP gateway provider not yet decided.
   */
  async sendOtp(_dto: OtpSendDto): Promise<{ messageSid: string }> {
    this.logger.warn('sendOtp called but OTP provider not configured (D-004)');
    throw new NotImplementedException(
      'OTP provider not configured — awaiting decision D-004 (identity provider)',
    );
  }

  /**
   * Verify an OTP code and issue access + refresh tokens.
   *
   * @stub D-004 — OTP gateway provider not yet decided.
   */
  async verifyOtp(_dto: OtpVerifyDto): Promise<AuthTokensDto> {
    this.logger.warn('verifyOtp called but OTP provider not configured (D-004)');
    throw new NotImplementedException(
      'OTP provider not configured — awaiting decision D-004 (identity provider)',
    );
  }

  /**
   * Refresh an access token using a valid refresh token.
   *
   * @stub D-004 — Refresh token store (session table) not yet implemented.
   */
  async refreshTokens(_refreshToken: string): Promise<AuthTokensDto> {
    throw new NotImplementedException('Token refresh not yet implemented — Prompt 7');
  }

  /**
   * Revoke all sessions for a customer (logout).
   *
   * @stub Prompt 7
   */
  async revokeCustomerSessions(_customerId: string): Promise<void> {
    throw new NotImplementedException('Session revocation not yet implemented — Prompt 7');
  }

  /**
   * Validate a decoded JWT payload and return the principal.
   * Called by JwtStrategy — must be fast (hot path).
   *
   * Returns null if the subject no longer exists or is suspended.
   *
   * @stub Returns the payload as-is until database look-up is wired.
   */
  async validatePayload(payload: JwtPayload): Promise<AuthenticatedUser | null> {
    // TODO (Prompt 7): Look up customer/staff record in DB to confirm active status.
    // For now, trust the JWT claims — appropriate only during development.
    this.logger.debug(`validatePayload: sub=${payload.sub} type=${payload.type}`);
    return {
      id: payload.sub,
      type: payload.type,
      role: payload.role,
      branchId: payload.branchId,
    };
  }
}
