/**
 * BranchController — public branch endpoints.
 *
 * GET /api/v1/branches           — list active branches
 * GET /api/v1/branches/:id       — single branch detail
 * GET /api/v1/branches/:id/hours — opening hours
 * GET /api/v1/branches/:id/menu  — branch-specific menu (prices from BranchProduct)
 */
import { Controller, Get, Param } from '@nestjs/common';
import { BranchService } from './branch.service.js';
import { MenuService } from './menu.service.js';

@Controller('branches')
export class BranchController {
  constructor(
    private readonly branchService: BranchService,
    private readonly menuService: MenuService,
  ) {}

  @Get()
  listBranches() {
    return this.branchService.listActive();
  }

  @Get(':id')
  getBranch(@Param('id') id: string) {
    return this.branchService.findById(id);
  }

  @Get(':id/hours')
  getBranchHours(@Param('id') id: string) {
    return this.branchService.getHours(id);
  }

  @Get(':id/services')
  getBranchServices(@Param('id') id: string) {
    return this.branchService.getServices(id);
  }

  @Get(':id/menu')
  getBranchMenu(@Param('id') id: string) {
    // Returns active products with branch-specific prices from BranchProduct.
    // Prices come from the transactional catalog — NOT from Sanity CMS display prices.
    return this.menuService.listByBranch(id);
  }

  @Get(':id/open')
  checkOpen(@Param('id') id: string) {
    return this.branchService.isCurrentlyOpen(id).then((open) => ({ branchId: id, open }));
  }
}
