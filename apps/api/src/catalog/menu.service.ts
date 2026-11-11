/**
 * MenuService — product catalog reads for public and cart use.
 *
 * PRICING RULE: Product prices come from BranchProduct.priceFils (transactional catalog).
 * CMS display prices (Sanity displayPriceAed) are for editorial preview only and
 * must NEVER be used to compute order totals.
 *
 * All prices are integer fils (1 AED = 100 fils). Never Float.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface MenuProductItem {
  variantId: string;
  variantSku: string;
  variantLabelEn: string;
  variantLabelAr: string;
  priceFils: number;
  available: boolean;
  productId: string;
  productNameEn: string;
  productNameAr: string;
  categoryId: string;
  modifierGroups: MenuModifierGroup[];
}

export interface MenuModifierGroup {
  groupId: string;
  nameEn: string;
  nameAr: string;
  minSelections: number;
  maxSelections: number;
  options: MenuModifierOption[];
}

export interface MenuModifierOption {
  optionId: string;
  labelEn: string;
  labelAr: string;
  priceDeltaFils: number;
  sortOrder: number;
}

@Injectable()
export class MenuService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * List active products for a branch with branch-specific pricing.
   * Only products with available=true in BranchProduct are returned.
   */
  async listByBranch(branchId: string): Promise<MenuProductItem[]> {
    const branchProducts = await this.db.client.branchProduct.findMany({
      where: {
        branchId,
        available: true,
        variant: { product: { status: 'ACTIVE' } },
      },
      select: {
        priceFils: true,
        available: true,
        variant: {
          select: {
            id: true,
            sku: true,
            labelEn: true,
            labelAr: true,
            product: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true,
                categoryId: true,
                modifierGroups: {
                  select: {
                    sortOrder: true,
                    group: {
                      select: {
                        id: true,
                        nameEn: true,
                        nameAr: true,
                        minSelections: true,
                        maxSelections: true,
                        options: {
                          where: { status: 'ACTIVE' },
                          select: {
                            id: true,
                            labelEn: true,
                            labelAr: true,
                            priceDeltaFils: true,
                            sortOrder: true,
                          },
                          orderBy: { sortOrder: 'asc' },
                        },
                      },
                    },
                  },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
      orderBy: { variant: { sortOrder: 'asc' } },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return branchProducts.map((bp: any) => ({
      variantId: bp.variant.id,
      variantSku: bp.variant.sku,
      variantLabelEn: bp.variant.labelEn,
      variantLabelAr: bp.variant.labelAr,
      priceFils: bp.priceFils,
      available: bp.available,
      productId: bp.variant.product.id,
      productNameEn: bp.variant.product.nameEn,
      productNameAr: bp.variant.product.nameAr,
      categoryId: bp.variant.product.categoryId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modifierGroups: bp.variant.product.modifierGroups.map((pmg: any) => ({
        groupId: pmg.group.id,
        nameEn: pmg.group.nameEn,
        nameAr: pmg.group.nameAr,
        minSelections: pmg.group.minSelections,
        maxSelections: pmg.group.maxSelections,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: pmg.group.options.map((opt: any) => ({
          optionId: opt.id,
          labelEn: opt.labelEn,
          labelAr: opt.labelAr,
          priceDeltaFils: opt.priceDeltaFils,
          sortOrder: opt.sortOrder,
        })),
      })),
    }));
  }

  /** Look up a single variant's price at a branch. Used by cart pricing. */
  async getVariantPrice(branchId: string, variantId: string): Promise<number> {
    const bp = await this.db.client.branchProduct.findUnique({
      where: { branchId_variantId: { branchId, variantId } },
      select: { priceFils: true, available: true },
    });
    if (!bp || !bp.available) {
      throw new NotFoundException(
        `Variant ${variantId} is not available at branch ${branchId}`,
      );
    }
    return bp.priceFils;
  }

  /** Validate that modifier options exist and belong to the product's groups. */
  async validateModifiers(
    variantId: string,
    optionIds: string[],
  ): Promise<Map<string, number>> {
    if (optionIds.length === 0) return new Map();

    // Get the product for this variant
    const variant = await this.db.client.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true },
    });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found`);

    // Get all modifier groups for the product
    const pmgs = await this.db.client.productModifierGroup.findMany({
      where: { productId: variant.productId },
      select: { groupId: true },
    });
    const validGroupIds = new Set(pmgs.map((pmg: { groupId: string }) => pmg.groupId));

    // Fetch the requested options
    const options = await this.db.client.modifierOption.findMany({
      where: { id: { in: optionIds }, status: 'ACTIVE' },
      select: { id: true, groupId: true, priceDeltaFils: true },
    });

    const priceDeltaMap = new Map<string, number>();
    for (const opt of options) {
      if (!validGroupIds.has(opt.groupId)) {
        throw new NotFoundException(
          `Modifier option ${opt.id} does not belong to product ${variant.productId}`,
        );
      }
      priceDeltaMap.set(opt.id, opt.priceDeltaFils);
    }

    // Check all requested IDs were found
    for (const id of optionIds) {
      if (!priceDeltaMap.has(id)) {
        throw new NotFoundException(`Modifier option ${id} not found or inactive`);
      }
    }

    return priceDeltaMap;
  }
}
