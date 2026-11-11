/**
 * CartController — cart CRUD endpoints.
 *
 * POST   /api/v1/carts                        — create guest cart
 * GET    /api/v1/carts/:id                    — get cart with quote
 * POST   /api/v1/carts/:id/branch             — set pickup branch
 * POST   /api/v1/carts/:id/items              — add item
 * PATCH  /api/v1/carts/:id/items/:itemId      — update quantity
 * DELETE /api/v1/carts/:id/items/:itemId      — remove item
 *
 * All mutating operations require the client to pass the current cart version
 * in the request body to prevent lost-update races.
 *
 * Authentication: Guest carts are accessed via the guestToken returned at
 * creation. Customer cart merging and authenticated cart access are in Prompt 7.
 */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { CartService } from './cart.service.js';

@Controller('carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /** Create a new guest cart. Returns the cart + a one-time guest token. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createCart(@Body() body: { branchId?: string }) {
    return this.cartService.createGuestCart(body.branchId);
  }

  /**
   * Get cart by ID.
   * Guest carts require X-Guest-Token header; customer carts require JWT (Prompt 7).
   */
  @Get(':id')
  getCart(
    @Param('id') id: string,
    @Headers('x-guest-token') guestToken?: string,
  ) {
    if (guestToken) {
      // Verify ownership via hashed token
      return this.cartService.findByGuestToken(guestToken);
    }
    // For now fall through to ID-based lookup (auth enforcement in Prompt 7)
    return this.cartService.findById(id);
  }

  /** Set the pickup branch for a cart. */
  @Post(':id/branch')
  @HttpCode(HttpStatus.OK)
  setBranch(
    @Param('id') id: string,
    @Body() body: { branchId: string; version: number },
  ) {
    return this.cartService.setBranch(id, body.branchId, body.version);
  }

  /** Add an item to the cart. */
  @Post(':id/items')
  @HttpCode(HttpStatus.OK)
  addItem(
    @Param('id') id: string,
    @Body()
    body: {
      version: number;
      variantId: string;
      quantity: number;
      modifierOptionIds?: string[];
    },
  ) {
    return this.cartService.addItem(id, body.version, {
      variantId: body.variantId,
      quantity: body.quantity,
      modifierOptionIds: body.modifierOptionIds,
    });
  }

  /** Update the quantity of a cart item. */
  @Patch(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { version: number; quantity: number },
  ) {
    return this.cartService.updateItem(id, itemId, body.version, body.quantity);
  }

  /** Remove a cart item. */
  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { version: number },
  ) {
    return this.cartService.removeItem(id, itemId, body.version);
  }
}
