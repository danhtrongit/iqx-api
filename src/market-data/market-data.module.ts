import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketDataGateway } from './market-data.gateway';
import { MarketDataController } from './market-data.controller';
import { TradingViewController } from './tradingview.controller';
import { TradingViewGateway } from './tradingview.gateway';
import { MqttService } from './services/mqtt.service';
import { DnseAuthService } from './services/dnse-auth.service';
import { TradingViewService } from './services/tradingview.service';
import { User } from '../entities/user.entity';
import { Symbol } from '../entities/symbol.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Symbol]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MarketDataController, TradingViewController],
  providers: [
    MarketDataGateway,
    TradingViewGateway,
    MqttService,
    DnseAuthService,
    TradingViewService,
  ],
  exports: [MqttService, TradingViewService],
})
export class MarketDataModule {}
