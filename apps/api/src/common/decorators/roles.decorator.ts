/**
 * @Roles() — declares which staff roles may access a route.
 *
 * Used together with RolesGuard (which reads this metadata).
 *
 * Usage:
 *   @Roles('BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN')
 *
 * Valid roles mirror the StaffRole enum in schema.prisma:
 *   BRANCH_BARISTA | BRANCH_SUPERVISOR | BRANCH_MANAGER
 *   OPERATIONS | FINANCE | MARKETING | ADMIN | SUPER_ADMIN
 *   CUSTOMER  (pseudo-role for customer token check in RolesGuard)
 */
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'milestones:roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
