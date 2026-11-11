/**
 * ShopController — online retail shop endpoints.
 *
 * GET /shop/categories          — list retail categories
 * GET /shop/products            — list retail products (paginated)
 * GET /shop/products/:slug      — product detail
 *
 * All endpoints are public (no auth required).
 * Cache-Control headers encourage CDN and browser caching.
 */
import {
  Controller,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ShopService } from './shop.service.js';

@Controller('shop')
export class ShopController {
  constructor(private readonly service: ShopService) {}

  @Get('categories')
  async listCategories(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return this.service.listCategories();
  }

  @Get('products')
  async listProducts(
    @Res({ passthrough: true }) res: Response,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    return this.service.listProducts({
      categoryId,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Get('products/:slug')
  async getProduct(
    @Param('slug') slug: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return this.service.getProduct(slug);
  }
}
