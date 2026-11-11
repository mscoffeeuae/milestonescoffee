/**
 * Auth type contracts.
 *
 * These interfaces are the boundary between AuthModule and all feature modules.
 * They must NOT import from @milestones/database — they live in the contracts layer.
 */

/** JWT payload stored in the access token. */
export interface JwtPayload {
  /** Subject — customerId (customer tokens) or staffUserId (staff tokens). */
  sub: string;
  /** Issuer — matches NEXT_PUBLIC_API_URL/auth. */
  iss: string;
  /** Issued-at (epoch seconds). */
  iat: number;
  /** Expiry (epoch seconds). */
  exp: number;
  /** Token type discriminant. */
  type: 'customer' | 'staff';
  /** Staff role — present on staff tokens only. */
  role?: string | undefined;
  /** Branch restriction — present on branch-scoped staff tokens. */
  branchId?: string | undefined;
}

/** Authenticated principal attached to request by JwtAuthGuard. */
export interface AuthenticatedUser {
  id: string;
  type: 'customer' | 'staff';
  role?: string | undefined;
  branchId?: string | undefined;
}

/** OTP send request body. */
export interface OtpSendDto {
  /** E.164 phone number e.g. +971501234567 */
  phoneE164: string;
  /** UI locale for the SMS message text. */
  locale: 'en' | 'ar';
}

/** OTP verify request body. */
export interface OtpVerifyDto {
  phoneE164: string;
  /** 6-digit code from SMS. */
  code: string;
}

/** Successful auth response returned to the client. */
export interface AuthTokensDto {
  accessToken: string;
  /** Seconds until access token expires. */
  expiresIn: number;
  /** Opaque refresh token. Store securely — do not log. */
  refreshToken: string;
}
