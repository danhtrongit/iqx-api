import { IsString, IsOptional, IsNumber, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchSymbolsDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  exchange?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 30;
}

export class GetSymbolInfoDto {
  @IsString()
  symbol: string;
}

export class GetHistoryDto {
  @IsString()
  symbol: string;

  @IsString()
  resolution: string;

  @Type(() => Number)
  @IsNumber()
  from: number;

  @Type(() => Number)
  @IsNumber()
  to: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  countback?: number;
}

export class GetQuotesDto {
  @IsString()
  symbols: string;
}

export class GetMarksDto {
  @IsString()
  symbol: string;

  @Type(() => Number)
  @IsNumber()
  from: number;

  @Type(() => Number)
  @IsNumber()
  to: number;

  @IsString()
  resolution: string;
}

export class GetSymbolInfoByGroupDto {
  @IsString()
  group: string;
}

// Response DTOs
export class TVConfigResponse {
  supported_resolutions: string[];
  supports_group_request: boolean;
  supports_marks: boolean;
  supports_search: boolean;
  supports_timescale_marks: boolean;
  exchanges: Array<{
    value: string;
    name: string;
    desc: string;
  }>;
  symbols_types: Array<{
    name: string;
    value: string;
  }>;
}

export class TVSymbolInfo {
  symbol: string;
  ticker: string;
  name: string;
  full_name: string;
  description: string;
  exchange: string;
  type: string;
  session: string;
  timezone: string;
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  has_daily: boolean;
  has_weekly_and_monthly: boolean;
  supported_resolutions: string[];
  data_status: string;
  currency_code?: string;
  original_currency_code?: string;
}

export class TVBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class TVHistoryResponse {
  s: 'ok' | 'no_data' | 'error';
  errmsg?: string;
  t?: number[];
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
  nextTime?: number;
}

export class TVSearchResponse {
  symbol: string;
  full_name: string;
  description: string;
  exchange: string;
  ticker: string;
  type: string;
}

export class TVQuoteValue {
  ch: number;
  chp: number;
  short_name: string;
  exchange: string;
  original_name: string;
  description: string;
  lp: number;
  ask: number;
  bid: number;
  open_price: number;
  high_price: number;
  low_price: number;
  prev_close_price: number;
  volume: number;
}

export class TVQuote {
  s: 'ok' | 'error';
  n: string;
  v: TVQuoteValue;
}

export class TVMarksResponse {
  id: any[];
  time: number[];
  color: string[];
  text: string[];
  label: string[];
  labelFontColor: string[];
  minSize: number[];
}

export class TVSymbolInfoGroupResponse {
  symbol: string[];
  description: string[];
  exchange_listed: string[];
  exchange_traded: string[];
  minmovement: number[];
  minmovement2: number[];
  pricescale: number[];
  has_dwm: boolean[];
  has_intraday: boolean[];
  has_no_volume: boolean[];
  type: string[];
  ticker: string[];
  timezone: string[];
  session_regular: string[];
}
