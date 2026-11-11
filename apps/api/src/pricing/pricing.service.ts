/**
 * PricingService — computes cart and order line totals.
 *
 * INVARIANT (documented in docs/DATABASE.md):
 *   order.totalFils = sum(lineTotal) + taxFils - discountFils
 *   lineTotal = (unitPriceFils + sum(modifierDeltas)) × quantity
 *
 * All arithmetic is integer fils. Never use floating-point for money.
 * No rounding errors are possible because all inputs are integers.
 *
 * Tax policy is pending decision D-007 (Finance). Until decided:
 *   - taxFils = 0 for all quotes
 *   - pricingPolicyVersion = "v0-pretax-stub"
 *
 * Promotions and loyalty discounts are applied in Prompt 10. This service
 * returns gross totals only (pre-promotion, pre-loyalty).
 */
import { Injectable } from '@nestjs/common';
import { MenuService } from '../catalog/menu.service.js';

export interface PriceLineInput {
  variantId: string;
  quantity: number;
  /** Modifier option IDs selected for this line. */
  modifierOptionIds: string[];
}

export interface PriceLine {
  variantId: string;
  quantity: number;
  unitPriceFils: number;
  modifierDeltaFils: number;
  lineTotalFils: number;
  modifierBreakdown: Array<{ optionId: string; priceDeltaFils: number }>;
}

export interface CartPriceQuote {
  branchId: string;
  lines: PriceLine[];
  subtotalFils: number;
  discountFils: number;
  taxFils: number;
  totalFils: number;
  pricingPolicyVersion: string;
}

/** Current pricing policy version — bump when tax rules or discount logic changes. */
export const PRICING_POLICY_VERSION = 'v0-pretax-stub';

@Injectable()
export class PricingService {
  constructor(private readonly menuService: MenuService) {}

  /**
   * Compute a price quote for a list of cart lines at a specific branch.
   *
   * Throws NotFoundException if any variant is unavailable at the branch
   * or if a modifier option is invalid for the variant.
   */
  async quoteCart(branchId: string, lines: PriceLineInput[]): Promise<CartPriceQuote> {
    const pricedLines: PriceLine[] = await Promise.all(
      lines.map((line) => this.priceLine(branchId, line)),
    );

    const subtotalFils = pricedLines.reduce((sum, l) => sum + l.lineTotalFils, 0);

    return {
      branchId,
      lines: pricedLines,
      subtotalFils,
      discountFils: 0,       // Promotions in Prompt 10
      taxFils: 0,            // Tax policy pending D-007
      totalFils: subtotalFils,
      pricingPolicyVersion: PRICING_POLICY_VERSION,
    };
  }

  /**
   * Price a single cart line.
   * unitPriceFils comes from BranchProduct (transactional catalog — NOT CMS).
   */
  async priceLine(branchId: string, line: PriceLineInput): Promise<PriceLine> {
    const unitPriceFils = await this.menuService.getVariantPrice(branchId, line.variantId);

    const modifierMap = await this.menuService.validateModifiers(
      line.variantId,
      line.modifierOptionIds,
    );

    const modifierBreakdown = line.modifierOptionIds.map((id) => ({
      optionId: id,
      priceDeltaFils: modifierMap.get(id) ?? 0,
    }));

    const modifierDeltaFils = modifierBreakdown.reduce(
      (sum, m) => sum + m.priceDeltaFils,
      0,
    );

    // Integer multiplication — no floating-point risk
    const lineTotalFils = (unitPriceFils + modifierDeltaFils) * line.quantity;

    return {
      variantId: line.variantId,
      quantity: line.quantity,
      unitPriceFils,
      modifierDeltaFils,
      lineTotalFils,
      modifierBreakdown,
    };
  }

  /**
   * Format fils as a display string "X.XX AED".
   * For display only — never parse this string back to a number.
   */
  static formatAed(fils: number): string {
    const aed = Math.trunc(fils / 100);
    const cents = Math.abs(fils % 100);
    return `${aed}.${cents.toString().padStart(2, '0')} AED`;
  }
}
