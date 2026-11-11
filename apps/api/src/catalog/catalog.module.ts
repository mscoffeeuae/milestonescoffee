/**
 * CatalogModule — public branch and menu read endpoints.
 *
 * All routes in this module are unauthenticated (public catalog).
 * Write operations (admin catalog management) are in a separate AdminCatalogModule
 * implemented in Prompt 8 (branch operations).
 */
import { Module } from '@nestjs/common';
import { BranchController } from './branch.controller.js';
import { BranchService } from './branch.service.js';
import { MenuController } from './menu.controller.js';
import { MenuService } from './menu.service.js';

@Module({
  controllers: [BranchController, MenuController],
  providers: [BranchService, MenuService],
  exports: [BranchService, MenuService],
})
export class CatalogModule {}
