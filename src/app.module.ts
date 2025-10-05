import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SymbolsModule } from './symbols/symbols.module';
import { VirtualTradingModule } from './virtual-trading/virtual-trading.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionModule } from './subscriptions/subscription.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { MarketDataModule } from './market-data/market-data.module';
import { PaymentModule } from './payment/payment.module';
import { ReferralModule } from './referral/referral.module';
import { AdminModule } from './admin/admin.module';
import { ChatModule } from './chat/chat.module';
import { ApiExtensionModule } from './api-extension/api-extension.module';
import { User } from './entities/user.entity';
import { UserPii } from './entities/user-pii.entity';
import { Session } from './entities/session.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PhoneVerificationCode } from './entities/phone-verification-code.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Symbol } from './entities/symbol.entity';
import { VirtualPortfolio } from './entities/virtual-portfolio.entity';
import { VirtualHolding } from './entities/virtual-holding.entity';
import { VirtualTransaction } from './entities/virtual-transaction.entity';
import { VirtualLeaderboard } from './entities/virtual-leaderboard.entity';
import { SubscriptionPackage } from './entities/subscription-package.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { Watchlist } from './entities/watchlist.entity';
import { Payment } from './entities/payment.entity';
import { ReferralCode } from './entities/referral-code.entity';
import { Commission } from './entities/commission.entity';
import { CommissionSetting } from './entities/commission-setting.entity';
import { ApiUsage } from './entities/api-usage.entity';
import { ApiExtensionPackage } from './entities/api-extension-package.entity';
import { UserApiExtension } from './entities/user-api-extension.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USER', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_NAME', 'auth_db'),
        entities: [
          User,
          UserPii,
          Session,
          PasswordResetToken,
          PhoneVerificationCode,
          AuditLog,
          Symbol,
          VirtualPortfolio,
          VirtualHolding,
          VirtualTransaction,
          VirtualLeaderboard,
          SubscriptionPackage,
          UserSubscription,
          Watchlist,
          Payment,
          ReferralCode,
          Commission,
          CommissionSetting,
          ApiUsage,
          ApiExtensionPackage,
          UserApiExtension,
        ],
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    SymbolsModule,
    VirtualTradingModule,
    SubscriptionModule,
    WatchlistModule,
    MarketDataModule,
    PaymentModule,
    ReferralModule,
    AdminModule,
    ChatModule,
    ApiExtensionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
