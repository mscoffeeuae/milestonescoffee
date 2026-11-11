/**
 * JwtStrategy — validates Bearer tokens on incoming requests.
 *
 * Uses @nestjs/passport + passport-jwt. The public key / secret is loaded from
 * environment variable JWT_SECRET (symmetric HS256 during development) or
 * JWT_PUBLIC_KEY (asymmetric RS256 in production).
 *
 * @stub D-004 — full asymmetric key configuration pending IdP decision.
 *
 * The strategy is registered as a provider in AuthModule and injected into
 * JwtAuthGuard via PassportStrategy.
 */
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import type { JwtPayload, AuthenticatedUser } from '../auth.types.js';
import { AuthService } from '../auth.service.js';

/**
 * Minimal JWT strategy stub.
 *
 * In production this will extend PassportStrategy(Strategy) from @nestjs/passport.
 * That dependency is intentionally deferred until D-004 so the package list stays
 * minimal during the scaffolding phase.
 *
 * The interface is locked: validate() must accept JwtPayload and return
 * AuthenticatedUser | null — this is what JwtAuthGuard depends on.
 */
@Injectable()
export class JwtStrategy {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Validate a decoded JWT payload.
   * Called by JwtAuthGuard after the token signature is verified.
   *
   * Throws UnauthorizedException if the principal is inactive or not found.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.authService.validatePayload(payload);
    if (!user) {
      this.logger.warn(`JWT validation failed: sub=${payload.sub} not found or inactive`);
      throw new UnauthorizedException('Token subject not found or inactive');
    }
    return user;
  }
}
