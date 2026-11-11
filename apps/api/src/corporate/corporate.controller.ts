import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CorporateService } from './corporate.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller('corporate')
export class CorporateController {
  constructor(private readonly corporate: CorporateService) {}

  // ---------------------------------------------------------------------------
  // Public — enquiry submission (contact form)
  // ---------------------------------------------------------------------------

  /**
   * Submit a corporate enquiry.
   * Public endpoint — no auth required. PDPL consent captured in body.
   */
  @Post('enquiries')
  @HttpCode(HttpStatus.CREATED)
  async submitEnquiry(
    @Body() body: {
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      companyName: string;
      message: string;
      consentEvidence: string;
    },
  ) {
    return this.corporate.submitEnquiry(body);
  }

  // ---------------------------------------------------------------------------
  // HQ — enquiry management
  // ---------------------------------------------------------------------------

  @Get('enquiries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HQ')
  async listEnquiries(@Query('status') status?: string) {
    return this.corporate.listEnquiries({ status });
  }

  @Get('enquiries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HQ')
  async getEnquiry(@Param('id') id: string) {
    return this.corporate.getEnquiry(id);
  }

  @Patch('enquiries/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HQ')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateEnquiryStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    await this.corporate.updateEnquiryStatus(id, body.status);
  }

  // ---------------------------------------------------------------------------
  // HQ — quote management
  // ---------------------------------------------------------------------------

  @Get('enquiries/:enquiryId/quotes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HQ')
  async listQuotes(@Param('enquiryId') enquiryId: string) {
    return this.corporate.listQuotesForEnquiry(enquiryId);
  }

  @Post('quotes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HQ')
  @HttpCode(HttpStatus.CREATED)
  async createQuote(
    @Body() body: {
      enquiryId: string;
      quoteNumber: string;
      lineItemsJson: unknown;
      totalFils: number;
      validUntil: string;
    },
  ) {
    return this.corporate.createQuote({
      ...body,
      validUntil: new Date(body.validUntil),
    });
  }

  @Post('quotes/:id/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HQ')
  @HttpCode(HttpStatus.OK)
  async sendQuote(@Param('id') id: string) {
    return this.corporate.sendQuote(id);
  }

  @Post('quotes/:id/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async acceptQuote(@Param('id') id: string) {
    return this.corporate.acceptQuote(id);
  }

  // ---------------------------------------------------------------------------
  // HQ — corporate accounts
  // ---------------------------------------------------------------------------

  @Get('accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HQ')
  async listAccounts() {
    return this.corporate.listAccounts();
  }

  @Post('accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HQ')
  @HttpCode(HttpStatus.CREATED)
  async createAccount(
    @Body() body: {
      nameEn: string;
      nameAr?: string | undefined;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      trn?: string | undefined;
    },
  ) {
    return this.corporate.createAccount(body);
  }
}
