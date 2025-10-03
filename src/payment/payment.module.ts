import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PayOSService } from './payos.service';
import { Payment } from '../entities/payment.entity';
import { User } from '../entities/user.entity';
import { SubscriptionPackage } from '../entities/subscription-package.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { ReferralModule } from '../referral/referral.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      User,
      SubscriptionPackage,
      UserSubscription,
    ]),
    ConfigModule,
    ReferralModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PayOSService],
  exports: [PaymentService, PayOSService],
})
export class PaymentModule {}
