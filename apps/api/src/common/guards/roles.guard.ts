/**
 * RolesGuard — restricts access to routes by staff role.
 *
 * Usage — apply AFTER JwtAuthGuard:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('ADMIN', 'SUPER_ADMIN')
 *   @Delete(':id')
 *   deleteProduct() { ... }
 *
 * Routes without @Roles() are allowed for all authenticated users (no role check).
 * Customer tokens (type='customer') fail role-restricted routes unless the
 * requested roles include 'CUSTOMER'.
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../auth/auth.types.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → allow any authenticated user.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    const hasRole =
      requiredRoles.includes(user.type) ||
      (user.role !== undefined && requiredRoles.includes(user.role));

    if (!hasRole) {
      throw new ForbiddenException(`Requires one of roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
