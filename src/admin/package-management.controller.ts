import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { PackageManagementService } from './package-management.service';
import {
  CreateSubscriptionPackageDto,
  UpdateSubscriptionPackageDto,
  CreateApiExtensionPackageDto,
  UpdateApiExtensionPackageDto,
} from './dto/package-management.dto';

@Controller('admin/packages')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PackageManagementController {
  constructor(
    private readonly packageManagementService: PackageManagementService,
  ) {}

  // ==================== SUBSCRIPTION PACKAGES ====================

  /**
   * GET /api/admin/packages/subscriptions
   * Get all subscription packages
   */
  @Get('subscriptions')
  async getAllSubscriptionPackages(
    @Query('includeInactive') includeInactive?: string,
  ) {
    const include = includeInactive === 'true';
    return this.packageManagementService.getAllSubscriptionPackages(include);
  }

  /**
   * GET /api/admin/packages/subscriptions/:id
   * Get subscription package by ID
   */
  @Get('subscriptions/:id')
  async getSubscriptionPackageById(@Param('id') id: string) {
    return this.packageManagementService.getSubscriptionPackageById(id);
  }

  /**
   * POST /api/admin/packages/subscriptions
   * Create new subscription package
   */
  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  async createSubscriptionPackage(@Body() dto: CreateSubscriptionPackageDto) {
    return this.packageManagementService.createSubscriptionPackage(dto);
  }

  /**
   * PUT /api/admin/packages/subscriptions/:id
   * Update subscription package
   */
  @Put('subscriptions/:id')
  async updateSubscriptionPackage(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPackageDto,
  ) {
    return this.packageManagementService.updateSubscriptionPackage(id, dto);
  }

  /**
   * DELETE /api/admin/packages/subscriptions/:id
   * Delete subscription package (soft delete)
   */
  @Delete('subscriptions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubscriptionPackage(@Param('id') id: string) {
    await this.packageManagementService.deleteSubscriptionPackage(id);
  }

  /**
   * GET /api/admin/packages/subscriptions/:id/stats
   * Get subscription package usage statistics
   */
  @Get('subscriptions/:id/stats')
  async getSubscriptionPackageStats(@Param('id') id: string) {
    return this.packageManagementService.getSubscriptionPackageStats(id);
  }

  // ==================== API EXTENSION PACKAGES ====================

  /**
   * GET /api/admin/packages/extensions
   * Get all API extension packages
   */
  @Get('extensions')
  async getAllApiExtensionPackages(
    @Query('includeInactive') includeInactive?: string,
  ) {
    const include = includeInactive === 'true';
    return this.packageManagementService.getAllApiExtensionPackages(include);
  }

  /**
   * GET /api/admin/packages/extensions/:id
   * Get API extension package by ID
   */
  @Get('extensions/:id')
  async getApiExtensionPackageById(@Param('id') id: string) {
    return this.packageManagementService.getApiExtensionPackageById(id);
  }

  /**
   * POST /api/admin/packages/extensions
   * Create new API extension package
   */
  @Post('extensions')
  @HttpCode(HttpStatus.CREATED)
  async createApiExtensionPackage(@Body() dto: CreateApiExtensionPackageDto) {
    return this.packageManagementService.createApiExtensionPackage(dto);
  }

  /**
   * PUT /api/admin/packages/extensions/:id
   * Update API extension package
   */
  @Put('extensions/:id')
  async updateApiExtensionPackage(
    @Param('id') id: string,
    @Body() dto: UpdateApiExtensionPackageDto,
  ) {
    return this.packageManagementService.updateApiExtensionPackage(id, dto);
  }

  /**
   * DELETE /api/admin/packages/extensions/:id
   * Delete API extension package (soft delete)
   */
  @Delete('extensions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteApiExtensionPackage(@Param('id') id: string) {
    await this.packageManagementService.deleteApiExtensionPackage(id);
  }

  /**
   * GET /api/admin/packages/extensions/:id/stats
   * Get API extension package usage statistics
   */
  @Get('extensions/:id/stats')
  async getApiExtensionPackageStats(@Param('id') id: string) {
    return this.packageManagementService.getApiExtensionPackageStats(id);
  }

  // ==================== OVERVIEW ====================

  /**
   * GET /api/admin/packages/overview
   * Get overview of all packages
   */
  @Get('overview')
  async getPackagesOverview() {
    return this.packageManagementService.getPackagesOverview();
  }
}


