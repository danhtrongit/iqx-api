import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Symbol } from '../../entities/symbol.entity';
import { MqttService } from './mqtt.service';
import {
  TVConfigResponse,
  TVSymbolInfo,
  TVBar,
  TVHistoryResponse,
  TVSearchResponse,
  TVQuote,
} from '../dto/tradingview.dto';

@Injectable()
export class TradingViewService {
  private readonly logger = new Logger(TradingViewService.name);
  private marketDataCache = new Map<string, any>();
  private historyDataCache = new Map<string, TVBar[]>();

  constructor(
    @InjectRepository(Symbol)
    private symbolRepository: Repository<Symbol>,
    private mqttService: MqttService,
  ) {
    this.setupMqttListeners();
  }

  private setupMqttListeners() {
    // Listen for real-time market data
    this.mqttService.on('message', ({ topic, message }) => {
      // Extract symbol from topic
      const symbolMatch = topic.match(/symbol\/([A-Z0-9]+)/);
      if (symbolMatch) {
        const symbol = symbolMatch[1];
        this.updateMarketDataCache(symbol, message);
      }
    });
  }

  private updateMarketDataCache(symbol: string, data: any) {
    const existing = this.marketDataCache.get(symbol) || {};
    this.marketDataCache.set(symbol, { ...existing, ...data, lastUpdate: Date.now() });
  }

  // Get TradingView configuration
  getConfig(): TVConfigResponse {
    return {
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
      supports_group_request: false,
      supports_marks: false,
      supports_search: true,
      supports_timescale_marks: false,
      exchanges: [
        {
          value: 'HOSE',
          name: 'Ho Chi Minh Stock Exchange',
          desc: 'HOSE',
        },
        {
          value: 'HNX',
          name: 'Hanoi Stock Exchange',
          desc: 'HNX',
        },
        {
          value: 'UPCOM',
          name: 'UPCoM',
          desc: 'Unlisted Public Company Market',
        },
      ],
      symbols_types: [
        { name: 'Stock', value: 'stock' },
        { name: 'Index', value: 'index' },
        { name: 'ETF', value: 'etf' },
        { name: 'Covered Warrant', value: 'cw' },
      ],
    };
  }

  // Search symbols
  async searchSymbols(query: string, type?: string, exchange?: string, limit: number = 30): Promise<TVSearchResponse[]> {
    const queryBuilder = this.symbolRepository.createQueryBuilder('symbol');
    
    // Search in symbol code and name
    queryBuilder.where(
      '(UPPER(symbol.symbol) LIKE UPPER(:query) OR UPPER(symbol.organ_name) LIKE UPPER(:query) OR UPPER(symbol.en_organ_name) LIKE UPPER(:query))',
      { query: `%${query}%` },
    );

    if (type) {
      queryBuilder.andWhere('symbol.type = :type', { type });
    }

    if (exchange) {
      queryBuilder.andWhere('symbol.board = :exchange', { exchange });
    }

    queryBuilder.limit(limit);

    const symbols = await queryBuilder.getMany();

    return symbols.map((symbol) => ({
      symbol: symbol.symbol,
      full_name: `${symbol.board}:${symbol.symbol}`,
      description: symbol.organ_name || symbol.en_organ_name || symbol.organ_short_name || '',
      exchange: symbol.board,
      ticker: symbol.symbol,
      type: this.mapSymbolType(symbol.type),
    }));
  }

  // Get symbol info
  async getSymbolInfo(symbolName: string): Promise<TVSymbolInfo | null> {
    const symbol = await this.symbolRepository.findOne({
      where: { symbol: symbolName },
    });

    if (!symbol) {
      return null;
    }

    return {
      symbol: symbol.symbol,
      ticker: symbol.symbol,
      name: symbol.organ_short_name || symbol.symbol,
      full_name: `${symbol.board}:${symbol.symbol}`,
      description: symbol.organ_name || symbol.en_organ_name || '',
      exchange: symbol.board,
      type: this.mapSymbolType(symbol.type),
      session: '0915-1500', // Vietnam trading hours
      timezone: 'Asia/Ho_Chi_Minh',
      minmov: 1,
      pricescale: 100, // 2 decimal places
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: true,
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
      data_status: 'streaming',
      currency_code: 'VND',
      original_currency_code: 'VND',
    };
  }

  // Get historical bars
  async getBars(
    symbol: string,
    resolution: string,
    from: number,
    to: number,
    countback?: number,
  ): Promise<TVHistoryResponse> {
    try {
      // For now, return mock data. In production, this would fetch from a real data source
      // You would typically fetch this from your database or external data provider
      
      // Subscribe to OHLC data if not already subscribed
      const ohlcTopic = `plaintext/quotes/krx/mdds/ohlc/v1/${this.mapResolution(resolution)}/symbol/${symbol}`;
      if (!this.mqttService.getSubscriptions().has(ohlcTopic)) {
        await this.mqttService.subscribe(ohlcTopic);
      }

      // Generate mock bars for demonstration
      const bars = this.generateMockBars(symbol, resolution, from, to, countback);
      
      if (bars.length === 0) {
        return { s: 'no_data' };
      }

      return {
        s: 'ok',
        t: bars.map((bar) => bar.time),
        o: bars.map((bar) => bar.open),
        h: bars.map((bar) => bar.high),
        l: bars.map((bar) => bar.low),
        c: bars.map((bar) => bar.close),
        v: bars.map((bar) => bar.volume),
      };
    } catch (error) {
      this.logger.error(`Error getting bars for ${symbol}:`, error);
      return { s: 'error', errmsg: error.message };
    }
  }

  // Get real-time quotes
  async getQuotes(symbols: string[]): Promise<{ [symbol: string]: TVQuote }> {
    const quotes: { [symbol: string]: TVQuote } = {};

    for (const symbol of symbols) {
      const symbolInfo = await this.getSymbolInfo(symbol);
      if (!symbolInfo) {
        quotes[symbol] = { s: 'error', n: symbol, v: {} as any };
        continue;
      }

      // Get cached market data or subscribe to real-time data
      let marketData = this.marketDataCache.get(symbol);
      
      if (!marketData || Date.now() - marketData.lastUpdate > 5000) {
        // Subscribe to tick data if not fresh
        await this.mqttService.subscribeToTick(symbol);
        await this.mqttService.subscribeToStockInfo(symbol);
        
        // Use mock data for now
        marketData = this.generateMockQuote(symbol);
      }

      quotes[symbol] = {
        s: 'ok',
        n: symbol,
        v: {
          ch: marketData.change || 0,
          chp: marketData.changePercent || 0,
          short_name: symbolInfo.name,
          exchange: symbolInfo.exchange,
          original_name: symbolInfo.full_name,
          description: symbolInfo.description,
          lp: marketData.lastPrice || 0,
          ask: marketData.askPrice || 0,
          bid: marketData.bidPrice || 0,
          open_price: marketData.openPrice || 0,
          high_price: marketData.highPrice || 0,
          low_price: marketData.lowPrice || 0,
          prev_close_price: marketData.prevClosePrice || 0,
          volume: marketData.volume || 0,
        },
      };
    }

    return quotes;
  }

  // Helper methods
  private mapSymbolType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'STOCK': 'stock',
      'INDEX': 'index',
      'ETF': 'etf',
      'CW': 'cw',
      'BOND': 'bond',
    };
    return typeMap[type.toUpperCase()] || 'stock';
  }

  private mapResolution(resolution: string): string {
    const resolutionMap: { [key: string]: string } = {
      '1': '1m',
      '5': '5m',
      '15': '15m',
      '30': '30m',
      '60': '1h',
      '240': '4h',
      '1D': '1D',
      '1W': '1W',
      '1M': '1M',
    };
    return resolutionMap[resolution] || '1D';
  }

  private generateMockBars(
    symbol: string,
    resolution: string,
    from: number,
    to: number,
    countback?: number,
  ): TVBar[] {
    // Generate mock historical data for demonstration
    const bars: TVBar[] = [];
    const interval = this.getIntervalSeconds(resolution);
    
    let currentTime = from;
    const basePrice = 50000 + Math.random() * 50000;
    
    while (currentTime <= to && (!countback || bars.length < countback)) {
      const open = basePrice + (Math.random() - 0.5) * 2000;
      const close = open + (Math.random() - 0.5) * 1000;
      const high = Math.max(open, close) + Math.random() * 500;
      const low = Math.min(open, close) - Math.random() * 500;
      
      bars.push({
        time: currentTime,
        open: Math.round(open),
        high: Math.round(high),
        low: Math.round(low),
        close: Math.round(close),
        volume: Math.floor(Math.random() * 1000000),
      });
      
      currentTime += interval;
    }
    
    return bars;
  }

  private generateMockQuote(symbol: string): any {
    const basePrice = 50000 + Math.random() * 50000;
    const change = (Math.random() - 0.5) * 2000;
    
    return {
      lastPrice: basePrice,
      change: change,
      changePercent: (change / basePrice) * 100,
      openPrice: basePrice - change * 0.5,
      highPrice: basePrice + Math.abs(change),
      lowPrice: basePrice - Math.abs(change),
      prevClosePrice: basePrice - change,
      volume: Math.floor(Math.random() * 10000000),
      bidPrice: basePrice - 100,
      askPrice: basePrice + 100,
      lastUpdate: Date.now(),
    };
  }

  private getIntervalSeconds(resolution: string): number {
    const intervals: { [key: string]: number } = {
      '1': 60,
      '5': 300,
      '15': 900,
      '30': 1800,
      '60': 3600,
      '240': 14400,
      '1D': 86400,
      '1W': 604800,
      '1M': 2592000,
    };
    return intervals[resolution] || 86400;
  }
}
