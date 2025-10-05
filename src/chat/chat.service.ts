import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ApiUsage } from '../entities/api-usage.entity';
import { User } from '../entities/user.entity';
import { UserSubscription, SubscriptionStatus } from '../entities/user-subscription.entity';
import { SubscriptionService } from '../subscriptions/subscription.service';
import { ChatRequestDto, ChatResponseDto, ApiUsageInfoDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly arixApiUrl: string;

  constructor(
    @InjectRepository(ApiUsage)
    private apiUsageRepository: Repository<ApiUsage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
    private subscriptionService: SubscriptionService,
    private configService: ConfigService,
  ) {
    this.arixApiUrl = this.configService.get<string>(
      'ARIX_API_URL',
      'http://localhost:5999',
    );
  }

  /**
   * Get current active subscription with API usage info
   */
  async getUserApiUsage(userId: string): Promise<ApiUsageInfoDto> {
    const activeSubscription = await this.userSubscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['package'],
      order: { expiresAt: 'DESC' },
    });

    if (!activeSubscription) {
      // Free tier - 100 API calls
      return {
        currentUsage: 0,
        limit: 100,
        remaining: 100,
        resetDate: 'N/A - Free tier has no expiration',
      };
    }

    const limit = activeSubscription.apiCallsLimit || 
                  activeSubscription.package?.apiLimit || 
                  100;
    const used = activeSubscription.apiCallsUsed || 0;

    return {
      currentUsage: used,
      limit,
      remaining: Math.max(0, limit - used),
      resetDate: activeSubscription.expiresAt.toISOString(),
    };
  }

  /**
   * Check if user has exceeded API limit
   */
  async checkApiLimit(userId: string): Promise<UserSubscription | null> {
    const activeSubscription = await this.userSubscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['package'],
      order: { expiresAt: 'DESC' },
    });

    // For free tier users
    if (!activeSubscription) {
      const usageInfo = await this.getUserApiUsage(userId);
      if (usageInfo.currentUsage >= usageInfo.limit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Đã vượt quá giới hạn API. Vui lòng nâng cấp gói để tiếp tục sử dụng.',
            currentUsage: usageInfo.currentUsage,
            limit: usageInfo.limit,
            suggestion: 'Mua gói subscription hoặc gói mở rộng API',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return null;
    }

    const limit = activeSubscription.apiCallsLimit || 
                  activeSubscription.package?.apiLimit || 
                  100;
    const used = activeSubscription.apiCallsUsed || 0;

    if (used >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Đã vượt quá giới hạn API của gói subscription',
          currentUsage: used,
          limit,
          expiresAt: activeSubscription.expiresAt,
          suggestion: 'Mua gói mở rộng API hoặc đợi đến khi gia hạn gói',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return activeSubscription;
  }

  /**
   * Increment API usage counter
   */
  async incrementApiUsage(
    userId: string,
    subscription: UserSubscription | null,
    tokensUsed: number = 0,
  ): Promise<void> {
    if (!subscription) {
      // Track for free tier (for statistics only)
      const today = new Date().toISOString().split('T')[0];
      let usage = await this.apiUsageRepository.findOne({
        where: { userId, usageDate: today },
      });

      if (!usage) {
        usage = this.apiUsageRepository.create({
          userId,
          usageDate: today,
          requestCount: 1,
          totalTokens: tokensUsed,
        });
      } else {
        usage.requestCount += 1;
        usage.totalTokens += tokensUsed;
      }
      await this.apiUsageRepository.save(usage);
      return;
    }

    // Increment subscription usage
    subscription.apiCallsUsed = (subscription.apiCallsUsed || 0) + 1;
    await this.userSubscriptionRepository.save(subscription);

    // Also track in api_usage for statistics
    const today = new Date().toISOString().split('T')[0];
    let usage = await this.apiUsageRepository.findOne({
      where: { userId: subscription.userId, usageDate: today },
    });

    if (!usage) {
      usage = this.apiUsageRepository.create({
        userId: subscription.userId,
        usageDate: today,
        requestCount: 1,
        totalTokens: tokensUsed,
      });
    } else {
      usage.requestCount += 1;
      usage.totalTokens += tokensUsed;
    }
    await this.apiUsageRepository.save(usage);
  }

  /**
   * Call AriX API to process chat request
   */
  async chat(
    userId: string,
    chatRequest: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    // Check API limit before processing
    const subscription = await this.checkApiLimit(userId);

    try {
      // Call AriX API
      const response = await fetch(`${this.arixApiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatRequest.message,
          model: chatRequest.model || 'gpt-5-chat-latest',
        }),
      });

      if (!response.ok) {
        throw new HttpException(
          'AriX API trả về lỗi',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data: ChatResponseDto = await response.json();

      // Increment usage counter
      const tokensUsed = data.usage?.total_tokens || 0;
      await this.incrementApiUsage(userId, subscription, tokensUsed);

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Không thể kết nối đến AriX API',
          error: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get API usage statistics for user
   */
  async getUserUsageStats(userId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const usageRecords = await this.apiUsageRepository
      .createQueryBuilder('usage')
      .where('usage.userId = :userId', { userId })
      .andWhere('usage.usageDate >= :startDate', { startDate: startDateStr })
      .orderBy('usage.usageDate', 'ASC')
      .getMany();

    const totalRequests = usageRecords.reduce(
      (sum, record) => sum + record.requestCount,
      0,
    );
    const totalTokens = usageRecords.reduce(
      (sum, record) => sum + record.totalTokens,
      0,
    );

    return {
      period: `${days} days`,
      totalRequests,
      totalTokens,
      dailyBreakdown: usageRecords.map((record) => ({
        date: record.usageDate,
        requests: record.requestCount,
        tokens: record.totalTokens,
      })),
    };
  }
}

