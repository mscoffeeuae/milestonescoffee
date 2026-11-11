/**
 * MenuController — global catalog endpoints (not branch-scoped).
 *
 * GET /api/v1/menu/categories — all active categories
 *
 * Branch-scoped menu is on BranchController: GET /branches/:id/menu
 */
import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Controller('menu')
export class MenuController {
  constructor(private readonly db: DatabaseService) {}

  /** List all active categories ordered by sort order. */
  @Get('categories')
  async listCategories() {
    return this.db.client.category.findMany({
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        slug: true,
        sortOrder: true,
        parentId: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
