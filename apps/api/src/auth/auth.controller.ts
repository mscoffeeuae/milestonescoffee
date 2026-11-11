/**
 * AuthController — customer OTP authentication endpoints.
 *
 * POST /api/v1/auth/otp/send    — send OTP to phone number
 * POST /api/v1/auth/otp/verify  — verify OTP, receive tokens
 * POST /api/v1/auth/refresh     — refresh access token
 * POST /api/v1/auth/logout      — revoke sessions (requires valid token)
 *
 * All endpoints currently return 501 (stub) until D-004 is resolved.
 */
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { OtpSendDto, OtpVerifyDto } from './auth.types.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Step 1: Request an OTP.
   * Accepts E.164 phone number, sends a 6-digit code via SMS.
   */
  @Post('otp/send')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendOtp(@Body() body: OtpSendDto) {
    return this.authService.sendOtp(body);
  }

  /**
   * Step 2: Verify the OTP and receive JWT tokens.
   */
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() body: OtpVerifyDto) {
    return this.authService.verifyOtp(body);
  }

  /**
   * Refresh an access token using a valid refresh token.
   * The refresh token is passed in the request body (never in a URL).
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  /**
   * Revoke all sessions for the authenticated customer.
   * Full implementation in Prompt 7 (requires JwtAuthGuard + session table).
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() body: { customerId: string }) {
    return this.authService.revokeCustomerSessions(body.customerId);
  }
}
