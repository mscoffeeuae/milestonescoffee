/**
 * JwtAuthGuard — protects routes requiring a valid customer or staff JWT.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: AuthenticatedUser) { ... }
 *
 * Routes that are publicly accessible (health, OTP send/verify, public catalog)
 * do NOT use this guard.
 *
 * @stub Full passport-jwt integration deferred to D-004.
 *       In development, inject any Bearer token with sub=<uuid> and type=customer.
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../auth/auth.types.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    // TODO (D-004 / Prompt 7): Verify JWT signature and expiry using jsonwebtoken or @nestjs/passport.
    // For now, extract sub from a stub token so integration tests can proceed.
    const token = authHeader.slice(7);

    try {
      // Stub: parse the payload section of the JWT without verification.
      // ⚠️ THIS IS NOT SECURE — replace with real verification before production.
      const payloadB64 = token.split('.')[1];
      if (!payloadB64) throw new Error('Invalid token structure');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
        sub?: string;
        type?: string;
        role?: string;
        branchId?: string;
      };

      if (!payload.sub || !payload.type) {
        throw new Error('Missing sub or type in token payload');
      }

      request.user = {
        id: payload.sub,
        type: payload.type as 'customer' | 'staff',
        role: payload.role,
        branchId: payload.branchId,
      };

      return true;
    } catch (error) {
      this.logger.debug('JWT validation failed', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
