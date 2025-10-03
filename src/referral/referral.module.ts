import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralService } from './referral.service';
import { CommissionService } from './commission.service';
import { ReferralController } from './referral.controller';
import { CommissionAdminController } from './commission-admin.controller';
import { ReferralCode } from '../entities/referral-code.entity';
import { Commission } from '../entities/commission.entity';
import { CommissionSetting } from '../entities/commission-setting.entity';
import { User } from '../entities/user.entity';
import { Payment } from '../entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReferralCode,
      Commission,
      CommissionSetting,
      User,
      Payment,
    ]),
  ],
  controllers: [ReferralController, CommissionAdminController],
  providers: [ReferralService, CommissionService],
  exports: [ReferralService, CommissionService],
})
export class ReferralModule {}
