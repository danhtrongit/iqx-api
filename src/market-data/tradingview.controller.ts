import {
  Controller,
  Get,
  Query,
  Param,
  Logger,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { TradingViewService } from './services/tradingview.service';
import {
  SearchSymbolsDto,
  GetSymbolInfoDto,
  GetHistoryDto,
  GetQuotesDto,
  GetMarksDto,
  GetSymbolInfoByGroupDto,
  TVConfigResponse,
  TVHistoryResponse,
  TVSearchResponse,
  TVQuote,
  TVMarksResponse,
  TVSymbolInfo,
} from './dto/tradingview.dto';

@Controller('tradingview')
export class TradingViewController {
  private readonly logger = new Logger(TradingViewController.name);

  constructor(private readonly tradingViewService: TradingViewService) {}

  /**
   * TradingView configuration endpoint
   * GET /tradingview/config
   */
  @Get('config')
  getConfig(): TVConfigResponse {
    this.logger.log('📊 TradingView config requested');
    return this.tradingViewService.getConfig();
  }

  /**
   * Symbol search endpoint
   * GET /tradingview/search?query=VNM&type=stock&exchange=HOSE&limit=30
   */
  @Get('search')
  async search(
    @Query(new ValidationPipe({ transform: true })) searchDto: SearchSymbolsDto,
  ): Promise<TVSearchResponse[]> {
    this.logger.log(`🔍 TradingView search: ${searchDto.query}, type: ${searchDto.type}, exchange: ${searchDto.exchange}`);
    
    const results = await this.tradingViewService.searchSymbols(
      searchDto.query,
      searchDto.type,
      searchDto.exchange,
      searchDto.limit,
    );

    return results;
  }

  /**
   * Symbol info endpoint
   * GET /tradingview/symbols?symbol=VNM
   */
  @Get('symbols')
  async getSymbolInfo(
    @Query(new ValidationPipe({ transform: true })) symbolDto: GetSymbolInfoDto,
  ): Promise<TVSymbolInfo> {
    this.logger.log(`📋 TradingView symbol info requested: ${symbolDto.symbol}`);
    
    const symbolInfo = await this.tradingViewService.getSymbolInfo(symbolDto.symbol);
    
    if (!symbolInfo) {
      throw new HttpException('Symbol not found', HttpStatus.NOT_FOUND);
    }

    return symbolInfo;
  }

  /**
   * Historical data endpoint
   * GET /tradingview/history?symbol=VNM&resolution=1D&from=1609459200&to=1640995200
   */
  @Get('history')
  async getHistory(
    @Query(new ValidationPipe({ transform: true })) historyDto: GetHistoryDto,
  ): Promise<TVHistoryResponse> {
    this.logger.log(
      `📈 TradingView history requested: ${historyDto.symbol}, resolution: ${historyDto.resolution}, from: ${historyDto.from}, to: ${historyDto.to}`,
    );

    const history = await this.tradingViewService.getBars(
      historyDto.symbol,
      historyDto.resolution,
      historyDto.from,
      historyDto.to,
      historyDto.countback,
    );

    return history;
  }

  /**
   * Real-time quotes endpoint
   * GET /tradingview/quotes?symbols=VNM,VIC,VHM
   */
  @Get('quotes')
  async getQuotes(
    @Query(new ValidationPipe({ transform: true })) quotesDto: GetQuotesDto,
  ): Promise<{ [symbol: string]: TVQuote }> {
    const symbolList = quotesDto.symbols.split(',').map((s) => s.trim());
    
    this.logger.log(`💹 TradingView quotes requested: ${symbolList.join(', ')}`);
    
    const quotes = await this.tradingViewService.getQuotes(symbolList);
    
    return quotes;
  }

  /**
   * Time endpoint (server time)
   * GET /tradingview/time
   */
  @Get('time')
  getTime(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Marks endpoint (optional, not implemented)
   * GET /tradingview/marks
   */
  @Get('marks')
  getMarks(
    @Query(new ValidationPipe({ transform: true })) marksDto: GetMarksDto,
  ): TVMarksResponse {
    this.logger.log(`📍 TradingView marks requested for ${marksDto.symbol}`);
    return {
      id: [],
      time: [],
      color: [],
      text: [],
      label: [],
      labelFontColor: [],
      minSize: [],
    };
  }

  /**
   * Timescale marks endpoint (optional, not implemented)
   * GET /tradingview/timescale_marks
   */
  @Get('timescale_marks')
  getTimescaleMarks(
    @Query(new ValidationPipe({ transform: true })) marksDto: GetMarksDto,
  ): any[] {
    this.logger.log(`⏱️ TradingView timescale marks requested for ${marksDto.symbol}`);
    return [];
  }

  /**
   * Symbol info by name endpoint (alternative format)
   * GET /tradingview/symbol_info
   */
  @Get('symbol_info')
  async getSymbolInfoByGroup(
    @Query(new ValidationPipe({ transform: true })) groupDto: GetSymbolInfoByGroupDto,
  ): Promise<any> {
    const symbols = groupDto.group.split(',').map((s) => s.trim());
    const results: any = {};

    for (const symbol of symbols) {
      const info = await this.tradingViewService.getSymbolInfo(symbol);
      if (info) {
        results[symbol] = info;
      }
    }

    return {
      symbol: Object.keys(results),
      description: Object.values(results).map((r: any) => r.description),
      exchange_listed: Object.values(results).map((r: any) => r.exchange),
      exchange_traded: Object.values(results).map((r: any) => r.exchange),
      minmovement: Object.values(results).map((r: any) => r.minmov),
      minmovement2: Object.values(results).map(() => 0),
      pricescale: Object.values(results).map((r: any) => r.pricescale),
      has_dwm: Object.values(results).map(() => true),
      has_intraday: Object.values(results).map(() => true),
      has_no_volume: Object.values(results).map(() => false),
      type: Object.values(results).map((r: any) => r.type),
      ticker: Object.values(results).map((r: any) => r.ticker),
      timezone: Object.values(results).map((r: any) => r.timezone),
      session_regular: Object.values(results).map((r: any) => r.session),
    };
  }
}
