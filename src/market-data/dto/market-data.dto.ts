import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class TickDataDto {
  @IsString()
  symbol: string;

  @IsNumber()
  matchPrice: number;

  @IsNumber()
  matchQtty: number;

  @IsString()
  side: string;

  @IsString()
  sendingTime: string;
}

export class StockInfoDto {
  @IsString()
  symbol: string;

  @IsNumber()
  @IsOptional()
  openPrice?: number;

  @IsNumber()
  @IsOptional()
  highPrice?: number;

  @IsNumber()
  @IsOptional()
  lowPrice?: number;

  @IsNumber()
  @IsOptional()
  closePrice?: number;

  @IsNumber()
  @IsOptional()
  currentPrice?: number;

  @IsNumber()
  @IsOptional()
  volume?: number;

  @IsString()
  @IsOptional()
  lastUpdate?: string;
}

export class TopPriceDto {
  @IsString()
  symbol: string;

  @IsNumber()
  @IsOptional()
  bidPrice1?: number;

  @IsNumber()
  @IsOptional()
  bidQtty1?: number;

  @IsNumber()
  @IsOptional()
  offerPrice1?: number;

  @IsNumber()
  @IsOptional()
  offerQtty1?: number;

  @IsString()
  @IsOptional()
  lastUpdate?: string;
}

export class BoardEventDto {
  @IsString()
  symbol: string;

  @IsString()
  sessionStatus: string;

  @IsString()
  eventTime: string;
}

export class MarketIndexDto {
  @IsString()
  indexCode: string;

  @IsNumber()
  indexValue: number;

  @IsNumber()
  changeValue: number;

  @IsNumber()
  changePercent: number;

  @IsString()
  lastUpdate: string;
}

export class OHLCDto {
  @IsString()
  symbol: string;

  @IsNumber()
  open: number;

  @IsNumber()
  high: number;

  @IsNumber()
  low: number;

  @IsNumber()
  close: number;

  @IsNumber()
  volume: number;

  @IsString()
  timestamp: string;

  @IsString()
  @IsOptional()
  resolution?: string;
}

export class SubscriptionDto {
  @IsString()
  topic: string;

  @IsString()
  @IsOptional()
  symbol?: string;

  @IsString()
  @IsOptional()
  market?: string;
}

export class UnsubscriptionDto {
  @IsString()
  topic: string;

  @IsString()
  @IsOptional()
  symbol?: string;
}
