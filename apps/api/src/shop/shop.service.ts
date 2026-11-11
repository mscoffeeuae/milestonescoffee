/**
 * ShopService — online retail shop (merchandise, beans, equipment).
 *
 * The shop surfaces a subset of the catalog for direct online purchase.
 * Products are filterable by category; retail products are identified by
 * their category.type being 'RETAIL' (as opposed to 'MENU' for F&B items).
 *
 * Feature flag: SHOP_ENABLED must be true per branch before shop orders
 * are accepted. This is checked at checkout time (not here).
 *
 * This service is READ-ONLY. Writes go through the catalog admin.
 * Order placement uses the existing CheckoutService.
 *
 * PWA caching:
 *   - Shop product listings are served with Cache-Control: max-age=300
 *   - Product detail pages with Cache-Control: max-age=3600
 *   - Frontend Next.js ISR handles stale-while-revalidate
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface ShopProductDto {
  id: string;
  sku: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  categoryId: string;
  categoryNameEn: string;
  categoryNameAr: string;
  variants: ShopVariantDto[];
  media: ShopMediaDto[];
}

export interface ShopVariantDto {
  id: string;
  sku: string;
  labelEn: string;
  labelAr: string;
  priceFils: number;
  sortOrder: number;
}

export interface ShopMediaDto {
  id: string;
  url: string;
  altEn: string;
  altAr: string;
  sortOrder: number;
}

export interface ShopListOptions {
  categoryId?: string | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
}

@Injectable()
export class ShopService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * List retail products available in the shop.
   * Returns only ACTIVE products from RETAIL-type categories.
   */
  async listProducts(options: ShopListOptions = {}): Promise<{
    products: ShopProductDto[];
    nextCursor: string | null;
  }> {
    const limit = Math.min(options.limit ?? 24, 100);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: 'ACTIVE',
      // Filter to retail categories by slug prefix convention.
      // A category with slug starting 'retail-' is treated as a retail (shop) category.
      // TODO: add Category.isRetail boolean column in next schema migration (Prompt 10).
      category: { slug: { startsWith: 'retail-' } },
    };

    if (options.categoryId) where.categoryId = options.categoryId;
    if (options.cursor) where.id = { lt: options.cursor };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products: any[] = await this.db.client.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        categoryId: true,
        category: { select: { id: true, nameEn: true, nameAr: true } },
        variants: {
          select: { id: true, sku: true, labelEn: true, labelAr: true, basePriceFils: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
        media: {
          select: { id: true, url: true, altEn: true, altAr: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
          take: 4,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    }) ?? [];

    const hasMore = products.length > limit;
    const page = hasMore ? products.slice(0, limit) : products;
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

    return {
      products: page.map(this.mapProduct),
      nextCursor,
    };
  }

  /** Get a single retail product by slug. */
  async getProduct(slug: string): Promise<ShopProductDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product: any = await this.db.client.product.findFirst({
      where: {
        slug,
        status: 'ACTIVE',
        category: { slug: { startsWith: 'retail-' } },
      },
      select: {
        id: true,
        sku: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        categoryId: true,
        category: { select: { id: true, nameEn: true, nameAr: true } },
        variants: {
          select: { id: true, sku: true, labelEn: true, labelAr: true, basePriceFils: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
        media: {
          select: { id: true, url: true, altEn: true, altAr: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) throw new NotFoundException(`Product '${slug}' not found`);

    return this.mapProduct(product);
  }

  /** List retail categories that have at least one active product. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async listCategories(): Promise<any[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories: any[] = await this.db.client.category.findMany({
      where: {
        slug: { startsWith: 'retail-' },
        products: { some: { status: 'ACTIVE' } },
      },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    }) ?? [];

    return categories;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapProduct(p: any): ShopProductDto {
    return {
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      categoryId: p.categoryId,
      categoryNameEn: p.category?.nameEn ?? '',
      categoryNameAr: p.category?.nameAr ?? '',
      variants: (p.variants ?? []).map((v: any) => ({
        id: v.id,
        sku: v.sku,
        labelEn: v.labelEn,
        labelAr: v.labelAr,
        priceFils: v.basePriceFils,  // base catalog price (branch overrides in BranchProduct)
        sortOrder: v.sortOrder,
      })),
      media: (p.media ?? []).map((m: any) => ({
        id: m.id,
        url: m.url,
        altEn: m.altEn ?? '',
        altAr: m.altAr ?? '',
        sortOrder: m.sortOrder,
      })),
    };
  }
}
