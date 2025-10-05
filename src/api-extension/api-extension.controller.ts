import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiExtensionService } from './api-extension.service';
import { CreateExtensionPaymentDto, PurchaseApiExtensionDto } from './dto/api-extension.dto';

@Controller('api-extensions')
export class ApiExtensionController {
  constructor(private readonly apiExtensionService: ApiExtensionService) {}

  /**
   * GET /api/api-extensions/packages
   * Get all available API extension packages
   */
  @Get('packages')
  async getPackages() {
    return this.apiExtensionService.getAllPackages();
  }

  /**
   * GET /api/api-extensions/packages/:id
   * Get specific extension package details
   */
  @Get('packages/:id')
  async getPackageById(@Param('id') id: string) {
    return this.apiExtensionService.getPackageById(id);
  }

  /**
   * POST /api/api-extensions/payment/create
   * Create payment for API extension package
   * Requires authentication
   */
  @Post('payment/create')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createExtensionPayment(
    @Request() req,
    @Body() dto: CreateExtensionPaymentDto,
  ) {
    const userId = req.user.id;
    return this.apiExtensionService.createExtensionPayment(userId, dto);
  }

  /**
   * GET /api/api-extensions/payment/check/:orderCode
   * Check payment status
   * Requires authentication
   */
  @Get('payment/check/:orderCode')
  @UseGuards(JwtAuthGuard)
  async checkPaymentStatus(
    @Request() req,
    @Param('orderCode') orderCode: string,
  ) {
    const userId = req.user.id;
    return this.apiExtensionService.checkExtensionPaymentStatus(
      userId,
      parseInt(orderCode, 10),
    );
  }

  /**
   * POST /api/api-extensions/purchase
   * Direct purchase (for admin or testing only)
   * Requires authentication
   */
  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async purchaseExtension(
    @Request() req,
    @Body() dto: PurchaseApiExtensionDto,
  ) {
    const userId = req.user.id;
    return this.apiExtensionService.purchaseExtension(userId, dto);
  }

  /**
   * GET /api/api-extensions/my-extensions
   * Get user's purchased extensions for current active subscription
   * Requires authentication
   */
  @Get('my-extensions')
  @UseGuards(JwtAuthGuard)
  async getMyExtensions(@Request() req) {
    const userId = req.user.id;
    return this.apiExtensionService.getUserExtensions(userId);
  }

  /**
   * GET /api/api-extensions/history
   * Get user's purchase history (all extensions ever purchased)
   * Requires authentication
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getPurchaseHistory(@Request() req) {
    const userId = req.user.id;
    return this.apiExtensionService.getPurchaseHistory(userId);
  }
}

