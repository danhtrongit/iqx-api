import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VirtualTradingController } from './virtual-trading.controller';
import { VirtualTradingService } from './virtual-trading.service';
import { VirtualPortfolio } from '../entities/virtual-portfolio.entity';
import { VirtualHolding } from '../entities/virtual-holding.entity';
import { VirtualTransaction } from '../entities/virtual-transaction.entity';
import { VirtualLeaderboard } from '../entities/virtual-leaderboard.entity';
import { Symbol } from '../entities/symbol.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VirtualPortfolio,
      VirtualHolding,
      VirtualTransaction,
      VirtualLeaderboard,
      Symbol,
    ]),
  ],
  controllers: [VirtualTradingController],
  providers: [VirtualTradingService],
  exports: [VirtualTradingService],
})
export class VirtualTradingModule {}
