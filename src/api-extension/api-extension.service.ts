import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiExtensionPackage } from '../entities/api-extension-package.entity';
import { UserApiExtension } from '../entities/user-api-extension.entity';
import { UserSubscription, SubscriptionStatus } from '../entities/user-subscription.entity';
import {
  CreateExtensionPaymentDto,
  PurchaseApiExtensionDto,
  ApiExtensionPackageResponseDto,
  UserApiExtensionResponseDto,
} from './dto/api-extension.dto';
import { ApiExtensionPaymentService } from './api-extension-payment.service';

@Injectable()
export class ApiExtensionService {
  constructor(
    @InjectRepository(ApiExtensionPackage)
    private apiExtensionPackageRepository: Repository<ApiExtensionPackage>,

    @InjectRepository(UserApiExtension)
    private userApiExtensionRepository: Repository<UserApiExtension>,

    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,

    private apiExtensionPaymentService: ApiExtensionPaymentService,
  ) {}

  /**
   * Get all active API extension packages
   */
  async getAllPackages(): Promise<ApiExtensionPackageResponseDto[]> {
    const packages = await this.apiExtensionPackageRepository.find({
      where: { isActive: true },
      order: { additionalCalls: 'ASC' },
    });

    return packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      additionalCalls: pkg.additionalCalls,
      price: Number(pkg.price),
      currency: pkg.currency,
      isActive: pkg.isActive,
      pricePerCall: Number(pkg.price) / pkg.additionalCalls,
    }));
  }

  /**
   * Get extension package by ID
   */
  async getPackageById(packageId: string): Promise<ApiExtensionPackage> {
    const pkg = await this.apiExtensionPackageRepository.findOne({
      where: { id: packageId, isActive: true },
    });

    if (!pkg) {
      throw new NotFoundException('Gói mở rộng không tồn tại');
    }

    return pkg;
  }

  /**
   * Purchase API extension package
   */
  async purchaseExtension(
    userId: string,
    dto: PurchaseApiExtensionDto,
  ): Promise<UserApiExtensionResponseDto> {
    // Get active subscription
    const activeSubscription = await this.userSubscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['package'],
      order: { expiresAt: 'DESC' },
    });

    if (!activeSubscription) {
      throw new BadRequestException(
        'Bạn cần có gói subscription đang hoạt động để mua gói mở rộng',
      );
    }

    // Check if subscription is expired
    if (activeSubscription.isExpired) {
      throw new BadRequestException(
        'Gói subscription của bạn đã hết hạn. Vui lòng gia hạn trước khi mua gói mở rộng',
      );
    }

    // Get extension package
    const extensionPackage = await this.getPackageById(dto.extensionPackageId);

    // Create user api extension record
    const userExtension = this.userApiExtensionRepository.create({
      userId,
      subscriptionId: activeSubscription.id,
      extensionPackageId: extensionPackage.id,
      additionalCalls: extensionPackage.additionalCalls,
      price: extensionPackage.price,
      currency: extensionPackage.currency,
      paymentReference: dto.paymentReference,
    });

    await this.userApiExtensionRepository.save(userExtension);

    // Update subscription API limit
    const currentLimit = activeSubscription.apiCallsLimit || 0;
    activeSubscription.apiCallsLimit = currentLimit + extensionPackage.additionalCalls;
    await this.userSubscriptionRepository.save(activeSubscription);

    return {
      id: userExtension.id,
      extensionPackageName: extensionPackage.name,
      additionalCalls: extensionPackage.additionalCalls,
      price: Number(extensionPackage.price),
      currency: extensionPackage.currency,
      purchasedAt: userExtension.createdAt,
      subscriptionId: activeSubscription.id,
    };
  }

  /**
   * Get user's purchased extensions for current subscription
   */
  async getUserExtensions(userId: string): Promise<UserApiExtensionResponseDto[]> {
    // Get active subscription
    const activeSubscription = await this.userSubscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: { expiresAt: 'DESC' },
    });

    if (!activeSubscription) {
      return [];
    }

    // Get all extensions for this subscription
    const extensions = await this.userApiExtensionRepository.find({
      where: {
        userId,
        subscriptionId: activeSubscription.id,
      },
      relations: ['extensionPackage'],
      order: { createdAt: 'DESC' },
    });

    return extensions.map((ext) => ({
      id: ext.id,
      extensionPackageName: ext.extensionPackage.name,
      additionalCalls: ext.additionalCalls,
      price: Number(ext.price),
      currency: ext.currency,
      purchasedAt: ext.createdAt,
      subscriptionId: ext.subscriptionId,
    }));
  }

  /**
   * Get purchase history (all extensions ever purchased)
   */
  async getPurchaseHistory(userId: string): Promise<UserApiExtensionResponseDto[]> {
    const extensions = await this.userApiExtensionRepository.find({
      where: { userId },
      relations: ['extensionPackage'],
      order: { createdAt: 'DESC' },
    });

    return extensions.map((ext) => ({
      id: ext.id,
      extensionPackageName: ext.extensionPackage.name,
      additionalCalls: ext.additionalCalls,
      price: Number(ext.price),
      currency: ext.currency,
      purchasedAt: ext.createdAt,
      subscriptionId: ext.subscriptionId,
    }));
  }

  /**
   * Calculate total additional calls for a subscription
   */
  async getTotalAdditionalCalls(subscriptionId: string): Promise<number> {
    const extensions = await this.userApiExtensionRepository.find({
      where: { subscriptionId },
    });

    return extensions.reduce((total, ext) => total + ext.additionalCalls, 0);
  }

  /**
   * Create extension payment (proxy to payment service)
   */
  async createExtensionPayment(
    userId: string,
    dto: CreateExtensionPaymentDto,
  ) {
    return this.apiExtensionPaymentService.createExtensionPayment(userId, dto);
  }

  /**
   * Check extension payment status (proxy to payment service)
   */
  async checkExtensionPaymentStatus(userId: string, orderCode: number) {
    return this.apiExtensionPaymentService.checkExtensionPaymentStatus(
      userId,
      orderCode,
    );
  }
}

