import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionScheduleService {
  private readonly logger = new Logger(SubscriptionScheduleService.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiredSubscriptions() {
    this.logger.log('Running subscription expiration check...');

    try {
      const updatedCount =
        await this.subscriptionService.checkAndUpdateExpiredSubscriptions();

      if (updatedCount > 0) {
        this.logger.log(`Updated ${updatedCount} expired subscriptions`);
      } else {
        this.logger.debug('No expired subscriptions found');
      }
    } catch (error) {
      this.logger.error('Error checking expired subscriptions:', error);
    }
  }

  @Cron('0 9 * * *')
  async dailySubscriptionReport() {
    this.logger.log('Generating daily subscription report...');

    try {
      const stats = await this.subscriptionService.getSubscriptionStats();
      this.logger.log(`Daily subscription stats: ${JSON.stringify(stats)}`);
    } catch (error) {
      this.logger.error('Error generating daily subscription report:', error);
    }
  }
}
