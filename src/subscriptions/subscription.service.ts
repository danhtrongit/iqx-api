import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPackage } from '../entities/subscription-package.entity';
import {
  UserSubscription,
  SubscriptionStatus,
} from '../entities/user-subscription.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionPackage)
    private subscriptionPackageRepository: Repository<SubscriptionPackage>,

    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAllPackages(): Promise<SubscriptionPackage[]> {
    return this.subscriptionPackageRepository.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  async getPackageById(packageId: string): Promise<SubscriptionPackage> {
    const subscriptionPackage =
      await this.subscriptionPackageRepository.findOne({
        where: { id: packageId, isActive: true },
      });

    if (!subscriptionPackage) {
      throw new NotFoundException('Subscription package not found');
    }

    return subscriptionPackage;
  }

  async getUserActiveSubscription(
    userId: string,
  ): Promise<UserSubscription | null> {
    return this.userSubscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['package'],
      order: { expiresAt: 'DESC' },
    });
  }

  async getUserSubscriptionHistory(
    userId: string,
  ): Promise<UserSubscription[]> {
    return this.userSubscriptionRepository.find({
      where: { userId },
      relations: ['package'],
      order: { createdAt: 'DESC' },
    });
  }

  async subscribeUser(
    userId: string,
    packageId: string,
    paymentReference?: string,
  ): Promise<UserSubscription> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscriptionPackage = await this.getPackageById(packageId);

    const existingActiveSubscription =
      await this.getUserActiveSubscription(userId);
    if (existingActiveSubscription && existingActiveSubscription.isActive) {
      throw new BadRequestException('User already has an active subscription');
    }

    const startsAt = new Date();
    const expiresAt = new Date(
      startsAt.getTime() +
        subscriptionPackage.durationDays * 24 * 60 * 60 * 1000,
    );

    const userSubscription = this.userSubscriptionRepository.create({
      userId,
      packageId,
      status: SubscriptionStatus.ACTIVE,
      startsAt,
      expiresAt,
      price: subscriptionPackage.price,
      currency: subscriptionPackage.currency,
      paymentReference,
    });

    return this.userSubscriptionRepository.save(userSubscription);
  }

  async renewSubscription(
    subscriptionId: string,
    paymentReference?: string,
  ): Promise<UserSubscription> {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['package'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Cannot renew cancelled subscription');
    }

    const subscriptionPackage = subscription.package;
    const startsAt = subscription.isExpired
      ? new Date()
      : subscription.expiresAt;
    const expiresAt = new Date(
      startsAt.getTime() +
        subscriptionPackage.durationDays * 24 * 60 * 60 * 1000,
    );

    const renewedSubscription = this.userSubscriptionRepository.create({
      userId: subscription.userId,
      packageId: subscription.packageId,
      status: SubscriptionStatus.ACTIVE,
      startsAt,
      expiresAt,
      price: subscriptionPackage.price,
      currency: subscriptionPackage.currency,
      paymentReference,
    });

    await this.userSubscriptionRepository.save(renewedSubscription);

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.userSubscriptionRepository.save(subscription);
    }

    return renewedSubscription;
  }

  async cancelSubscription(
    subscriptionId: string,
    reason?: string,
  ): Promise<UserSubscription> {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Can only cancel active subscriptions');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason;

    return this.userSubscriptionRepository.save(subscription);
  }

  async checkAndUpdateExpiredSubscriptions(): Promise<number> {
    const expiredSubscriptions = await this.userSubscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
    });

    let updatedCount = 0;
    for (const subscription of expiredSubscriptions) {
      if (subscription.isExpired) {
        subscription.status = SubscriptionStatus.EXPIRED;
        await this.userSubscriptionRepository.save(subscription);
        updatedCount++;
      }
    }

    return updatedCount;
  }

  async getSubscriptionStats(userId?: string) {
    const query = this.userSubscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.package', 'package');

    if (userId) {
      query.where('subscription.userId = :userId', { userId });
    }

    const subscriptions = await query.getMany();

    const stats = {
      total: subscriptions.length,
      active: subscriptions.filter((s) => s.isActive).length,
      expired: subscriptions.filter(
        (s) => s.status === SubscriptionStatus.EXPIRED,
      ).length,
      cancelled: subscriptions.filter(
        (s) => s.status === SubscriptionStatus.CANCELLED,
      ).length,
      totalRevenue: subscriptions.reduce(
        (sum, s) => sum + Number(s.price || 0),
        0,
      ),
    };

    return stats;
  }

  async getUserCurrentPlan(userId: string) {
    const activeSubscription = await this.getUserActiveSubscription(userId);

    if (!activeSubscription) {
      return {
        hasPlan: false,
        planName: 'Free',
        features: {
          maxVirtualPortfolios: 1,
          dailyApiLimit: 100,
        },
      };
    }

    return {
      hasPlan: true,
      planName: activeSubscription.package.name,
      expiresAt: activeSubscription.expiresAt,
      features: {
        maxVirtualPortfolios:
          activeSubscription.package.maxVirtualPortfolios || 999,
        dailyApiLimit: activeSubscription.package.dailyApiLimit || 999999,
        ...activeSubscription.package.features,
      },
    };
  }
}
