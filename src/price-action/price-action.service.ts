import { Injectable, Logger } from '@nestjs/common';

interface StockPrice {
  symbol?: string; // symbol (from API response)
  s?: string; // symbol alternative field
  c: number[]; // close prices
  o: number[]; // open prices
  h: number[]; // high prices
  l: number[]; // low prices
  v: number[]; // volume
  t: string[]; // timestamps (as strings)
}

interface GoogleSheetsResponse {
  range: string;
  majorDimension: string;
  values: string[][];
}

interface PriceActionCache {
  data: any[];
  timestamp: number;
}

@Injectable()
export class PriceActionService {
  private readonly logger = new Logger(PriceActionService.name);
  private priceActionCache: PriceActionCache | null = null;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly GOOGLE_SHEETS_URL =
    'https://sheets.googleapis.com/v4/spreadsheets/1ekb2bYAQJZbtmqMUzsagb4uWBdtkAzTq3kuIMHQ22RI/values/PriceAction?key=AIzaSyB9PPBCGbWFv1TxH_8s_AsiqiChLs9MqXU';

  async getPriceActionData(): Promise<{
    data: any[];
    cachedAt: string;
  }> {
    try {
      // Check if cache is valid
      if (
        this.priceActionCache &&
        Date.now() - this.priceActionCache.timestamp < this.CACHE_TTL
      ) {
        this.logger.log('Trả về dữ liệu price action từ cache');
        return {
          data: this.priceActionCache.data,
          cachedAt: new Date(this.priceActionCache.timestamp).toISOString(),
        };
      }

      this.logger.log('Bắt đầu lấy dữ liệu price action mới...');

      // Fetch from Google Sheets
      const tickerList = await this.fetchPriceActionTickers();

      if (!tickerList || tickerList.length === 0) {
        throw new Error('Không có dữ liệu từ Google Sheets');
      }

      this.logger.log(`Lấy được ${tickerList.length} mã từ Google Sheets`);

      // Calculate price action for each ticker
      const priceActionData = await this.calculatePriceActionForTickers(
        tickerList,
      );

      // Update cache
      const cacheTimestamp = Date.now();
      this.priceActionCache = {
        data: priceActionData,
        timestamp: cacheTimestamp,
      };

      this.logger.log('Đã cập nhật cache price action');

      return {
        data: priceActionData,
        cachedAt: new Date(cacheTimestamp).toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy dữ liệu price action: ${error.message}`,
      );
      throw error;
    }
  }

  private async fetchPriceActionTickers(): Promise<
    Array<{ ticker: string; date: string }>
  > {
    try {
      const response = await fetch(this.GOOGLE_SHEETS_URL);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: GoogleSheetsResponse = await response.json();

      if (!data.values || data.values.length <= 1) {
        return [];
      }

      // Skip header row and parse data
      // Row format: [date, ticker, ...] - DATE is in column A, Symbol in column B
      const tickers: Array<{ ticker: string; date: string }> = [];
      for (let i = 1; i < data.values.length; i++) {
        const row = data.values[i];
        if (row.length >= 2 && row[0] && row[1]) {
          const date = row[0].trim();
          const ticker = row[1].trim().toUpperCase();
          
          // Only add if ticker looks valid (2-10 chars, no special chars)
          if (ticker && ticker.length >= 2 && ticker.length <= 10 && /^[A-Z0-9]+$/.test(ticker)) {
            tickers.push({
              ticker: ticker,
              date: date,
            });
          }
        }
      }

      this.logger.log(`Parsed ${tickers.length} valid tickers from Google Sheets`);
      return tickers;
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy dữ liệu từ Google Sheets: ${error.message}`,
      );
      throw error;
    }
  }

  private async calculatePriceActionForTickers(
    tickerList: Array<{ ticker: string; date: string }>,
  ): Promise<any[]> {
    const results: any[] = [];
    const batchSize = 50; // Process 5 symbols at a time to avoid overwhelming the API

    for (let i = 0; i < tickerList.length; i += batchSize) {
      const batch = tickerList.slice(i, i + batchSize);
      const batchPromises = batch.map(async (item) => {
        try {
          const metrics = await this.calculatePriceActionMetrics(item.ticker);
          return {
            ticker: item.ticker,
            date: item.date,
            ...metrics,
          };
        } catch (error) {
          this.logger.error(
            `Lỗi khi tính toán metrics cho ${item.ticker}: ${error.message}`,
          );
          return {
            ticker: item.ticker,
            date: item.date,
            currentPrice: null,
            change1D: null,
            change7D: null,
            change30D: null,
            volume: null,
            avgVolume3M: null,
            high3M: null,
            percentFromHigh3M: null,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      this.logger.log(
        `Đã xử lý ${Math.min(i + batchSize, tickerList.length)}/${tickerList.length} mã`,
      );

      // Add small delay between batches
      if (i + batchSize < tickerList.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  private async calculatePriceActionMetrics(ticker: string): Promise<{
    currentPrice: number | null;
    change1D: number | null;
    change7D: number | null;
    change30D: number | null;
    volume: number | null;
    avgVolume3M: number | null;
    high3M: number | null;
    percentFromHigh3M: number | null;
  }> {
    try {
      // Fetch 3 months of data (approximately 90 trading days)
      const ohlcData = await this.fetchOHLCData(ticker, 90);

      if (!ohlcData || ohlcData.c.length === 0) {
        return {
          currentPrice: null,
          change1D: null,
          change7D: null,
          change30D: null,
          volume: null,
          avgVolume3M: null,
          high3M: null,
          percentFromHigh3M: null,
        };
      }

      const closePrices = ohlcData.c;
      const highPrices = ohlcData.h;
      const volumes = ohlcData.v;

      // Index 0 is OLDEST, last index is NEWEST (confirmed by test)
      const lastIndex = closePrices.length - 1;
      const currentPrice = closePrices[lastIndex];

      // Calculate percentage changes (current is at lastIndex, previous is earlier)
      const change1D = this.calculatePercentageChange(
        closePrices,
        lastIndex,
        1,
      );
      const change7D = this.calculatePercentageChange(
        closePrices,
        lastIndex,
        7,
      );
      const change30D = this.calculatePercentageChange(
        closePrices,
        lastIndex,
        30,
      );

      // Current volume (last index)
      const volume = volumes[lastIndex];

      // Average volume for 3 months
      const avgVolume3M =
        volumes.length > 0
          ? volumes.reduce((sum, v) => sum + v, 0) / volumes.length
          : null;

      // Highest price in 3 months
      const high3M = highPrices.length > 0 ? Math.max(...highPrices) : null;

      // Percentage from 3-month high
      const percentFromHigh3M =
        currentPrice && high3M && high3M > 0
          ? Number((((currentPrice - high3M) / high3M) * 100).toFixed(2))
          : null;

      return {
        currentPrice: currentPrice || null,
        change1D,
        change7D,
        change30D,
        volume: volume || null,
        avgVolume3M: avgVolume3M ? Math.round(avgVolume3M) : null,
        high3M: high3M || null,
        percentFromHigh3M,
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi tính toán metrics cho ${ticker}: ${error.message}`,
      );
      throw error;
    }
  }

  private calculatePercentageChange(
    prices: number[],
    currentIndex: number,
    daysBack: number,
  ): number | null {
    // Index 0 is oldest, so we subtract daysBack to go to older data
    const previousIndex = currentIndex - daysBack;
    
    if (previousIndex < 0 || prices.length <= daysBack) {
      return null;
    }

    const currentPrice = prices[currentIndex];
    const previousPrice = prices[previousIndex];

    if (!currentPrice || !previousPrice || previousPrice === 0) {
      return null;
    }

    return Number(
      (((currentPrice - previousPrice) / previousPrice) * 100).toFixed(2),
    );
  }

  private async fetchOHLCData(
    ticker: string,
    countBack: number,
  ): Promise<StockPrice | null> {
    try {
      const now = Date.now();
      const to = Math.floor(now / 1000);

      const response = await fetch(
        'https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Referer: 'https://trading.vietcap.com.vn/',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          body: JSON.stringify({
            timeFrame: 'ONE_DAY',
            symbols: [ticker],
            to: to,
            countBack: countBack,
          }),
        },
      );

      if (!response.ok) {
        this.logger.error(`HTTP error: ${response.status} for symbol ${ticker}`);
        return null;
      }

      const data: StockPrice[] = await response.json();

      if (data && data.length > 0) {
        const stockData = data[0];
        this.logger.debug(
          `Fetched ${ticker}: c.length=${stockData.c?.length}, first close=${stockData.c?.[0]}, last close=${stockData.c?.[stockData.c.length - 1]}`,
        );
        return stockData;
      }

      this.logger.warn(`No data returned for ${ticker}`);
      return null;
    } catch (error) {
      this.logger.error(`Lỗi khi lấy OHLC data ${ticker}: ${error.message}`);
      return null;
    }
  }
}

