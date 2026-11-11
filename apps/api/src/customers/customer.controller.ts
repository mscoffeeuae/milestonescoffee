/**
 * CustomerController — customer account management endpoints.
 *
 * All routes require JWT authentication (D-004).
 * Customers can only access their own records.
 *
 * GET    /customers/me                   — profile
 * PATCH  /customers/me                   — update profile
 * GET    /customers/me/addresses         — list addresses
 * POST   /customers/me/addresses         — add address
 * PATCH  /customers/me/addresses/:id     — update address
 * DELETE /customers/me/addresses/:id     — delete address
 * GET    /customers/me/orders            — order history
 * POST   /customers/me/consents          — record consent
 * POST   /customers/me/deletion-request  — request account deletion
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './customer.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { UpdateProfileInput, CreateAddressInput, UpdateAddressInput, ConsentInput } from './customer.types.js';

@Controller('customers/me')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getProfile(user.id);
  }

  @Patch()
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateProfileInput) {
    return this.service.updateProfile(user.id, body);
  }

  @Get('addresses')
  listAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listAddresses(user.id);
  }

  @Post('addresses')
  createAddress(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateAddressInput) {
    return this.service.createAddress(user.id, body);
  }

  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateAddressInput,
  ) {
    return this.service.updateAddress(user.id, id, body);
  }

  @Delete('addresses/:id')
  @HttpCode(204)
  deleteAddress(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.deleteAddress(user.id, id);
  }

  @Get('orders')
  listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.service.listOrders(user.id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Post('consents')
  @HttpCode(204)
  recordConsent(@CurrentUser() user: AuthenticatedUser, @Body() body: ConsentInput) {
    return this.service.recordConsent(user.id, body);
  }

  @Post('deletion-request')
  requestDeletion(@CurrentUser() user: AuthenticatedUser) {
    return this.service.requestDeletion(user.id);
  }
}
