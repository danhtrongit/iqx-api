import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserSubscription, SubscriptionStatus } from '../entities/user-subscription.entity';
import { SubscriptionPackage } from '../entities/subscription-package.entity';
import { AuditLog } from '../entities/audit-log.entity';
import {
  ListUsersQueryDto,
  UpdateUserRoleDto,
  AssignSubscriptionDto,
  UpdateSubscriptionDto,
  UserStatsDto,
} from './dto/user-management.dto';

@Injectable()
export class UserManagementService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPackage)
    private subscriptionPackageRepository: Repository<SubscriptionPackage>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async listUsers(query: ListUsersQueryDto) {
    const { search, role, isActive, sortBy, sortOrder } = query;
    
    // Use default values if not provided
    const page = query.page || 1;
    const limit = query.limit || 10;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userSubscriptions', 'subscription')
      .leftJoinAndSelect('subscription.package', 'package');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(user.email LIKE :search OR user.displayName LIKE :search OR user.fullName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply role filter
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // Apply isActive filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // Apply sorting
    const sortField = sortBy === 'email' ? 'user.email' : `user.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users.map((user) => this.sanitizeUser(user)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'userSubscriptions',
        'userSubscriptions.package',
        'virtualPortfolios',
        'referralCodes',
        'commissions',
      ],
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return this.sanitizeUser(user);
  }

  async activateUser(
    userId: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (user.isActive) {
      throw new BadRequestException('Người dùng đã được kích hoạt');
    }

    user.isActive = true;
    await this.userRepository.save(user);

    // Log audit
    await this.createAuditLog(
      'admin.user.activate',
      adminId,
      ipAddress,
      userAgent,
      { targetUserId: userId },
    );

    return {
      message: 'Kích hoạt người dùng thành công',
      user: this.sanitizeUser(user),
    };
  }

  async deactivateUser(
    userId: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (!user.isActive) {
      throw new BadRequestException('Người dùng đã bị khóa');
    }

    if (user.role === 'admin') {
      throw new BadRequestException('Không thể khóa tài khoản admin');
    }

    user.isActive = false;
    await this.userRepository.save(user);

    // Log audit
    await this.createAuditLog(
      'admin.user.deactivate',
      adminId,
      ipAddress,
      userAgent,
      { targetUserId: userId },
    );

    return {
      message: 'Khóa người dùng thành công',
      user: this.sanitizeUser(user),
    };
  }

  async updateUserRole(
    userId: string,
    updateRoleDto: UpdateUserRoleDto,
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const oldRole = user.role;
    user.role = updateRoleDto.role;
    await this.userRepository.save(user);

    // Log audit
    await this.createAuditLog(
      'admin.user.update_role',
      adminId,
      ipAddress,
      userAgent,
      { targetUserId: userId, oldRole, newRole: updateRoleDto.role },
    );

    return {
      message: 'Cập nhật vai trò người dùng thành công',
      user: this.sanitizeUser(user),
    };
  }

  async assignSubscription(
    userId: string,
    assignDto: AssignSubscriptionDto,
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const subscriptionPackage = await this.subscriptionPackageRepository.findOne({
      where: { id: assignDto.packageId },
    });

    if (!subscriptionPackage) {
      throw new NotFoundException('Gói subscription không tồn tại');
    }

    if (!subscriptionPackage.isActive) {
      throw new BadRequestException('Gói subscription không còn hoạt động');
    }

    // Check if user already has an active subscription for this package
    const existingSubscription = await this.userSubscriptionRepository.findOne({
      where: {
        userId,
        packageId: assignDto.packageId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubscription) {
      throw new ConflictException(
        'Người dùng đã có subscription đang hoạt động cho gói này',
      );
    }

    // Calculate dates
    const startsAt = assignDto.startsAt
      ? new Date(assignDto.startsAt)
      : new Date();

    const durationDays =
      assignDto.durationDays || subscriptionPackage.durationDays;

    const expiresAt = new Date(startsAt);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    // Create subscription
    const subscription = this.userSubscriptionRepository.create({
      userId,
      packageId: assignDto.packageId,
      status: SubscriptionStatus.ACTIVE,
      startsAt,
      expiresAt,
      autoRenew: assignDto.autoRenew || false,
      price: subscriptionPackage.price,
      currency: subscriptionPackage.currency,
    });

    await this.userSubscriptionRepository.save(subscription);

    // Log audit
    await this.createAuditLog(
      'admin.user.assign_subscription',
      adminId,
      ipAddress,
      userAgent,
      { targetUserId: userId, packageId: assignDto.packageId },
    );

    return {
      message: 'Gắn gói subscription cho người dùng thành công',
      subscription: await this.userSubscriptionRepository.findOne({
        where: { id: subscription.id },
        relations: ['package'],
      }),
    };
  }

  async getUserSubscriptions(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const subscriptions = await this.userSubscriptionRepository.find({
      where: { userId },
      relations: ['package'],
      order: { createdAt: 'DESC' },
    });

    return subscriptions;
  }

  async updateSubscription(
    userId: string,
    subscriptionId: string,
    updateDto: UpdateSubscriptionDto,
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
      relations: ['package'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription không tồn tại');
    }

    // Update fields
    if (updateDto.status) {
      subscription.status = updateDto.status;
      
      if (updateDto.status === SubscriptionStatus.CANCELLED) {
        subscription.cancelledAt = new Date();
        subscription.cancellationReason = updateDto.cancellationReason;
      }
    }

    if (updateDto.expiresAt) {
      subscription.expiresAt = new Date(updateDto.expiresAt);
    }

    if (updateDto.autoRenew !== undefined) {
      subscription.autoRenew = updateDto.autoRenew;
    }

    await this.userSubscriptionRepository.save(subscription);

    // Log audit
    await this.createAuditLog(
      'admin.user.update_subscription',
      adminId,
      ipAddress,
      userAgent,
      { targetUserId: userId, subscriptionId, updateDto },
    );

    return {
      message: 'Cập nhật subscription thành công',
      subscription,
    };
  }

  async cancelSubscription(
    userId: string,
    subscriptionId: string,
    reason: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription không tồn tại');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription đã bị hủy');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason;

    await this.userSubscriptionRepository.save(subscription);

    // Log audit
    await this.createAuditLog(
      'admin.user.cancel_subscription',
      adminId,
      ipAddress,
      userAgent,
      { targetUserId: userId, subscriptionId, reason },
    );

    return {
      message: 'Hủy subscription thành công',
      subscription,
    };
  }

  async getUserStats(): Promise<UserStatsDto> {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({
      where: { isActive: true },
    });
    const inactiveUsers = totalUsers - activeUsers;

    const premiumUsers = await this.userRepository.count({
      where: { role: 'premium' },
    });

    const adminUsers = await this.userRepository.count({
      where: { role: 'admin' },
    });

    // Calculate new users this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const newUsersThisMonth = await this.userRepository.count({
      where: {
        createdAt: Between(startOfMonth, endOfMonth),
      },
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      premiumUsers,
      adminUsers,
      newUsersThisMonth,
    };
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  private async createAuditLog(
    action: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    data?: any,
  ) {
    await this.auditLogRepository.save({
      userId,
      action,
      ipAddress,
      userAgent,
      data,
    });
  }
}

