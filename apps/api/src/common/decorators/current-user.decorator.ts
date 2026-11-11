/**
 * @CurrentUser() — extracts the authenticated principal from the request.
 *
 * Usage:
 *   @Get('profile')
 *   @UseGuards(JwtAuthGuard)
 *   getProfile(@CurrentUser() user: AuthenticatedUser) {
 *     return { id: user.id };
 *   }
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../auth/auth.types.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new Error('@CurrentUser() used outside JwtAuthGuard — guard not applied?');
    }
    return request.user;
  },
);
