import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPackage } from '../entities/subscription-package.entity';
import { ApiExtensionPackage } from '../entities/api-extension-package.entity';
import { UserSubscription, SubscriptionStatus } from '../entities/user-subscription.entity';
import { UserApiExtension } from '../entities/user-api-extension.entity';
import {
  CreateSubscriptionPackageDto,
  UpdateSubscriptionPackageDto,
  CreateApiExtensionPackageDto,
  UpdateApiExtensionPackageDto,
} from './dto/package-management.dto';

@Injectable()
export class PackageManagementService {
  constructor(
    @InjectRepository(SubscriptionPackage)
    private subscriptionPackageRepository: Repository<SubscriptionPackage>,

    @InjectRepository(ApiExtensionPackage)
    private apiExtensionPackageRepository: Repository<ApiExtensionPackage>,

    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,

    @InjectRepository(UserApiExtension)
    private userApiExtensionRepository: Repository<UserApiExtension>,
  ) {}

  // ==================== SUBSCRIPTION PACKAGES ====================

  /**
   * Get all subscription packages (including inactive)
   */
  async getAllSubscriptionPackages(
    includeInactive: boolean = false,
  ): Promise<SubscriptionPackage[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.subscriptionPackageRepository.find({
      where,
      order: { price: 'ASC' },
    });
  }

  /**
   * Get subscription package by ID
   */
  async getSubscriptionPackageById(id: string): Promise<SubscriptionPackage> {
    const pkg = await this.subscriptionPackageRepository.findOne({
      where: { id },
    });

    if (!pkg) {
      throw new NotFoundException('Gói subscription không tồn tại');
    }

    return pkg;
  }

  /**
   * Create new subscription package
   */
  async createSubscriptionPackage(
    dto: CreateSubscriptionPackageDto,
  ): Promise<SubscriptionPackage> {
    // Check if name exists
    const existing = await this.subscriptionPackageRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Tên gói đã tồn tại');
    }

    const pkg = this.subscriptionPackageRepository.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });

    return this.subscriptionPackageRepository.save(pkg);
  }

  /**
   * Update subscription package
   */
  async updateSubscriptionPackage(
    id: string,
    dto: UpdateSubscriptionPackageDto,
  ): Promise<SubscriptionPackage> {
    const pkg = await this.getSubscriptionPackageById(id);

    // Check if new name conflicts
    if (dto.name && dto.name !== pkg.name) {
      const existing = await this.subscriptionPackageRepository.findOne({
        where: { name: dto.name },
      });

      if (existing) {
        throw new BadRequestException('Tên gói đã tồn tại');
      }
    }

    Object.assign(pkg, dto);
    return this.subscriptionPackageRepository.save(pkg);
  }

  /**
   * Delete subscription package (soft delete by setting isActive = false)
   */
  async deleteSubscriptionPackage(id: string): Promise<void> {
    const pkg = await this.getSubscriptionPackageById(id);

    // Check if any active subscriptions use this package
    const activeCount = await this.userSubscriptionRepository.count({
      where: {
        packageId: id,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (activeCount > 0) {
      throw new BadRequestException(
        `Không thể xóa gói vì có ${activeCount} subscription đang active`,
      );
    }

    pkg.isActive = false;
    await this.subscriptionPackageRepository.save(pkg);
  }

  /**
   * Get package usage statistics
   */
  async getSubscriptionPackageStats(id: string) {
    const pkg = await this.getSubscriptionPackageById(id);

    const totalSubscriptions = await this.userSubscriptionRepository.count({
      where: { packageId: id },
    });

    const activeSubscriptions = await this.userSubscriptionRepository.count({
      where: { packageId: id, status: SubscriptionStatus.ACTIVE },
    });

    const subscriptions = await this.userSubscriptionRepository.find({
      where: { packageId: id },
    });

    const totalRevenue = subscriptions.reduce(
      (sum, sub) => sum + Number(sub.price || 0),
      0,
    );

    return {
      package: pkg,
      stats: {
        totalSubscriptions,
        activeSubscriptions,
        totalRevenue,
      },
    };
  }

  // ==================== API EXTENSION PACKAGES ====================

  /**
   * Get all API extension packages (including inactive)
   */
  async getAllApiExtensionPackages(
    includeInactive: boolean = false,
  ): Promise<ApiExtensionPackage[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.apiExtensionPackageRepository.find({
      where,
      order: { additionalCalls: 'ASC' },
    });
  }

  /**
   * Get API extension package by ID
   */
  async getApiExtensionPackageById(id: string): Promise<ApiExtensionPackage> {
    const pkg = await this.apiExtensionPackageRepository.findOne({
      where: { id },
    });

    if (!pkg) {
      throw new NotFoundException('Gói mở rộng không tồn tại');
    }

    return pkg;
  }

  /**
   * Create new API extension package
   */
  async createApiExtensionPackage(
    dto: CreateApiExtensionPackageDto,
  ): Promise<ApiExtensionPackage> {
    // Check if name exists
    const existing = await this.apiExtensionPackageRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Tên gói đã tồn tại');
    }

    const pkg = this.apiExtensionPackageRepository.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });

    return this.apiExtensionPackageRepository.save(pkg);
  }

  /**
   * Update API extension package
   */
  async updateApiExtensionPackage(
    id: string,
    dto: UpdateApiExtensionPackageDto,
  ): Promise<ApiExtensionPackage> {
    const pkg = await this.getApiExtensionPackageById(id);

    // Check if new name conflicts
    if (dto.name && dto.name !== pkg.name) {
      const existing = await this.apiExtensionPackageRepository.findOne({
        where: { name: dto.name },
      });

      if (existing) {
        throw new BadRequestException('Tên gói đã tồn tại');
      }
    }

    Object.assign(pkg, dto);
    return this.apiExtensionPackageRepository.save(pkg);
  }

  /**
   * Delete API extension package (soft delete)
   */
  async deleteApiExtensionPackage(id: string): Promise<void> {
    const pkg = await this.getApiExtensionPackageById(id);
    pkg.isActive = false;
    await this.apiExtensionPackageRepository.save(pkg);
  }

  /**
   * Get extension package usage statistics
   */
  async getApiExtensionPackageStats(id: string) {
    const pkg = await this.getApiExtensionPackageById(id);

    const purchases = await this.userApiExtensionRepository.find({
      where: { extensionPackageId: id },
    });

    const totalPurchases = purchases.length;
    const totalRevenue = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.price || 0),
      0,
    );
    const totalCallsSold = purchases.reduce(
      (sum, purchase) => sum + purchase.additionalCalls,
      0,
    );

    return {
      package: pkg,
      stats: {
        totalPurchases,
        totalRevenue,
        totalCallsSold,
      },
    };
  }

  // ==================== OVERVIEW STATS ====================

  /**
   * Get overview of all packages
   */
  async getPackagesOverview() {
    const subscriptionPackages =
      await this.getAllSubscriptionPackages(true);
    const extensionPackages = await this.getAllApiExtensionPackages(true);

    const totalSubscriptions = await this.userSubscriptionRepository.count();
    const activeSubscriptions = await this.userSubscriptionRepository.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    const totalExtensionPurchases =
      await this.userApiExtensionRepository.count();

    const allSubscriptions = await this.userSubscriptionRepository.find();
    const subscriptionRevenue = allSubscriptions.reduce(
      (sum, sub) => sum + Number(sub.price || 0),
      0,
    );

    const allExtensions = await this.userApiExtensionRepository.find();
    const extensionRevenue = allExtensions.reduce(
      (sum, ext) => sum + Number(ext.price || 0),
      0,
    );

    return {
      subscriptionPackages: {
        total: subscriptionPackages.length,
        active: subscriptionPackages.filter((p) => p.isActive).length,
        packages: subscriptionPackages,
      },
      extensionPackages: {
        total: extensionPackages.length,
        active: extensionPackages.filter((p) => p.isActive).length,
        packages: extensionPackages,
      },
      usage: {
        totalSubscriptions,
        activeSubscriptions,
        totalExtensionPurchases,
      },
      revenue: {
        subscriptions: subscriptionRevenue,
        extensions: extensionRevenue,
        total: subscriptionRevenue + extensionRevenue,
      },
    };
  }
}

