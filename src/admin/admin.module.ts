import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';
import { PackageManagementController } from './package-management.controller';
import { PackageManagementService } from './package-management.service';
import { User } from '../entities/user.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { SubscriptionPackage } from '../entities/subscription-package.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { ApiExtensionPackage } from '../entities/api-extension-package.entity';
import { UserApiExtension } from '../entities/user-api-extension.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserSubscription,
      SubscriptionPackage,
      AuditLog,
      ApiExtensionPackage,
      UserApiExtension,
    ]),
  ],
  controllers: [UserManagementController, PackageManagementController],
  providers: [UserManagementService, PackageManagementService],
  exports: [UserManagementService, PackageManagementService],
})
export class AdminModule {}

