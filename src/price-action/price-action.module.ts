import { Module } from '@nestjs/common';
import { PriceActionController } from './price-action.controller';
import { PriceActionService } from './price-action.service';

@Module({
  controllers: [PriceActionController],
  providers: [PriceActionService],
  exports: [PriceActionService],
})
export class PriceActionModule {}

