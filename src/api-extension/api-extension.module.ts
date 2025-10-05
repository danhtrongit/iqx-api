import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ApiExtensionController } from './api-extension.controller';
import { ApiExtensionService } from './api-extension.service';
import { ApiExtensionPaymentService } from './api-extension-payment.service';
import { ApiExtensionPackage } from '../entities/api-extension-package.entity';
import { UserApiExtension } from '../entities/user-api-extension.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { Payment } from '../entities/payment.entity';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { PayOSService } from '../payment/payos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApiExtensionPackage,
      UserApiExtension,
      UserSubscription,
      Payment,
      User,
    ]),
    ConfigModule,
    AuthModule,
  ],
  controllers: [ApiExtensionController],
  providers: [ApiExtensionService, ApiExtensionPaymentService, PayOSService],
  exports: [ApiExtensionService, ApiExtensionPaymentService],
})
export class ApiExtensionModule {}

