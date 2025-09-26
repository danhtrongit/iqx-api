import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SymbolsController } from './symbols.controller';
import { SymbolsService } from './symbols.service';
import { Symbol } from '../entities/symbol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Symbol]), ScheduleModule.forRoot()],
  controllers: [SymbolsController],
  providers: [SymbolsService],
  exports: [SymbolsService],
})
export class SymbolsModule {}
