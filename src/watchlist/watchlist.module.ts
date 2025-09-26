import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Watchlist } from '../entities/watchlist.entity';
import { Symbol } from '../entities/symbol.entity';
import { User } from '../entities/user.entity';
import { WatchlistService } from './watchlist.service';
import { WatchlistController } from './watchlist.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Watchlist, Symbol, User])],
  controllers: [WatchlistController],
  providers: [WatchlistService],
  exports: [WatchlistService],
})
export class WatchlistModule {}
