import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPackage } from '../entities/subscription-package.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { User } from '../entities/user.entity';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionScheduleService } from './subscription-schedule.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPackage, UserSubscription, User]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionScheduleService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
