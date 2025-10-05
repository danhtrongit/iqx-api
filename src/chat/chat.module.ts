import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ApiUsage } from '../entities/api-usage.entity';
import { User } from '../entities/user.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { SubscriptionModule } from '../subscriptions/subscription.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiUsage, User, UserSubscription]),
    ConfigModule,
    SubscriptionModule,
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

