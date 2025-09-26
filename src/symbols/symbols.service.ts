import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Symbol } from '../entities/symbol.entity';
import { GetSymbolsDto } from './dto/get-symbols.dto';
import {
  SymbolsResponseDto,
  PaginationMetaDto,
  SymbolResponseDto,
} from './dto/symbols-response.dto';

interface StockPrice {
  s: string; // symbol
  c: number[]; // close prices
  o: number[]; // open prices
  h: number[]; // high prices
  l: number[]; // low prices
  v: number[]; // volume
  t: number[]; // timestamps
}

@Injectable()
export class SymbolsService {
  private readonly logger = new Logger(SymbolsService.name);

  constructor(
    @InjectRepository(Symbol)
    private symbolRepository: Repository<Symbol>,
  ) {}

  async getSymbols(queryDto: GetSymbolsDto): Promise<SymbolsResponseDto> {
    const {
      symbol,
      type,
      board,
      search,
      page = 1,
      limit = 20,
      includePrices,
    } = queryDto;

    const where: any = {};

    // Lọc theo symbol
    if (symbol) {
      where.symbol = `%${symbol}%`;
      where.symbolLike = true;
    }

    // Lọc theo type
    if (type) {
      where.type = type;
    }

    // Lọc theo board
    if (board) {
      where.board = board;
    }

    const queryBuilder = this.symbolRepository.createQueryBuilder('symbol');

    // Apply basic filters
    Object.keys(where).forEach((key) => {
      if (where[key]) {
        queryBuilder.andWhere(
          `symbol.${key} ${key === 'symbol' && where.symbolLike ? 'LIKE' : '='} :${key}`,
          {
            [key]:
              typeof where[key] === 'object'
                ? `%${where[key].value}%`
                : where[key],
          },
        );
      }
    });

    // Search với ưu tiên symbol
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(symbol.organ_name) LIKE LOWER(:search) OR LOWER(symbol.organ_short_name) LIKE LOWER(:search) OR LOWER(symbol.en_organ_name) LIKE LOWER(:search) OR LOWER(symbol.symbol) LIKE LOWER(:search))',
        {
          search: `%${search}%`,
        },
      );
    }

    // Pagination
    const offset = (page - 1) * limit;

    // Sắp xếp ưu tiên symbol matching
    if (search) {
      queryBuilder
        .orderBy(
          `CASE
            WHEN symbol.symbol = :exactSearch THEN 1
            WHEN LOWER(symbol.symbol) LIKE LOWER(:startSearch) THEN 2
            WHEN LOWER(symbol.symbol) LIKE LOWER(:search) THEN 3
            ELSE 4
          END`,
          'ASC',
        )
        .addOrderBy('symbol.symbol', 'ASC')
        .setParameter('exactSearch', search.toUpperCase())
        .setParameter('startSearch', `${search.toUpperCase()}%`);
    } else {
      queryBuilder.orderBy('symbol.symbol', 'ASC');
    }

    queryBuilder.offset(offset).limit(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    // Add prices if requested
    let symbolsWithPrices: SymbolResponseDto[] = data.map((symbol) => ({
      id: symbol.id,
      symbol: symbol.symbol,
      type: symbol.type,
      board: symbol.board,
      en_organ_name: symbol.en_organ_name,
      organ_short_name: symbol.organ_short_name,
      organ_name: symbol.organ_name,
      product_grp_id: symbol.product_grp_id,
    }));

    if (includePrices) {
      symbolsWithPrices = await this.addPricesToSymbols(symbolsWithPrices);
    }

    const totalPages = Math.ceil(total / limit);
    const hasPreviousPage = page > 1;
    const hasNextPage = page < totalPages;

    const meta: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages,
      hasPreviousPage,
      hasNextPage,
    };

    return {
      data: symbolsWithPrices,
      meta,
      message: 'Lấy danh sách chứng khoán thành công',
    };
  }

  async syncSymbols(): Promise<void> {
    try {
      this.logger.log('Bắt đầu đồng bộ dữ liệu chứng khoán từ VietCap...');

      const symbols = await this.fetchSymbolsFromVietCap();

      if (!symbols || !Array.isArray(symbols)) {
        throw new Error('Không thể lấy dữ liệu từ VietCap API');
      }

      this.logger.log(`Nhận được ${symbols.length} chứng khoán từ API`);

      // Lọc và xử lý dữ liệu
      const validSymbols = symbols.filter(
        (symbolData) =>
          symbolData.symbol &&
          symbolData.type &&
          symbolData.board &&
          symbolData.board !== 'DELISTED', // Loại bỏ các mã đã bị hủy niêm yết
      );

      this.logger.log(
        `Có ${validSymbols.length} mã chứng khoán hợp lệ để xử lý`,
      );

      // Batch insert/update
      const batchSize = 100;
      let processed = 0;

      for (let i = 0; i < validSymbols.length; i += batchSize) {
        const batch = validSymbols.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (symbolData: any) => {
            try {
              await this.symbolRepository.upsert(
                {
                  id: symbolData.id,
                  symbol: symbolData.symbol,
                  type: symbolData.type,
                  board: symbolData.board,
                  en_organ_name: symbolData.en_organ_name,
                  organ_short_name: symbolData.organ_short_name,
                  organ_name: symbolData.organ_name,
                  product_grp_id: symbolData.product_grp_id,
                },
                ['id'],
              );
            } catch (error) {
              this.logger.error(
                `Lỗi khi xử lý symbol ${symbolData.symbol}: ${error.message}`,
              );
            }
          }),
        );

        processed += batch.length;
        this.logger.log(
          `Đã xử lý ${processed}/${validSymbols.length} chứng khoán`,
        );
      }

      this.logger.log('Hoàn thành đồng bộ dữ liệu chứng khoán');
    } catch (error) {
      this.logger.error(
        `Lỗi khi đồng bộ dữ liệu chứng khoán: ${error.message}`,
      );
      throw error;
    }
  }

  // Chạy sync tự động mỗi ngày lúc 6h sáng
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleCron() {
    this.logger.log('Chạy tự động đồng bộ dữ liệu chứng khoán...');
    try {
      await this.syncSymbols();
    } catch (error) {
      this.logger.error(`Lỗi khi chạy tự động sync: ${error.message}`);
    }
  }

  async getSymbolByCode(symbolCode: string): Promise<Symbol | null> {
    return await this.symbolRepository.findOne({
      where: { symbol: symbolCode.toUpperCase() },
    });
  }

  async getSymbolsCount(): Promise<number> {
    return await this.symbolRepository.count();
  }

  async getAllSymbols(queryDto: Omit<GetSymbolsDto, 'page' | 'limit'>) {
    const { symbol, type, board, search, includePrices } = queryDto;

    const queryBuilder = this.symbolRepository.createQueryBuilder('symbol');

    // Apply filters
    if (symbol) {
      queryBuilder.andWhere('LOWER(symbol.symbol) LIKE LOWER(:symbol)', {
        symbol: `%${symbol}%`,
      });
    }

    if (type) {
      queryBuilder.andWhere('symbol.type = :type', { type });
    }

    if (board) {
      queryBuilder.andWhere('symbol.board = :board', { board });
    }

    // Search trong tên công ty
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(symbol.organ_name) LIKE LOWER(:search) OR LOWER(symbol.organ_short_name) LIKE LOWER(:search) OR LOWER(symbol.en_organ_name) LIKE LOWER(:search) OR LOWER(symbol.symbol) LIKE LOWER(:search))',
        {
          search: `%${search}%`,
        },
      );
    }

    // Sắp xếp ưu tiên symbol matching
    if (search) {
      queryBuilder
        .orderBy(
          `CASE
            WHEN symbol.symbol = :exactSearch THEN 1
            WHEN LOWER(symbol.symbol) LIKE LOWER(:startSearch) THEN 2
            WHEN LOWER(symbol.symbol) LIKE LOWER(:search) THEN 3
            ELSE 4
          END`,
          'ASC',
        )
        .addOrderBy('symbol.symbol', 'ASC')
        .setParameter('exactSearch', search.toUpperCase())
        .setParameter('startSearch', `${search.toUpperCase()}%`);
    } else {
      queryBuilder.orderBy('symbol.symbol', 'ASC');
    }

    const data = await queryBuilder.getMany();

    // Add prices if requested
    let symbolsWithPrices: SymbolResponseDto[] = data.map((symbol) => ({
      id: symbol.id,
      symbol: symbol.symbol,
      type: symbol.type,
      board: symbol.board,
      en_organ_name: symbol.en_organ_name,
      organ_short_name: symbol.organ_short_name,
      organ_name: symbol.organ_name,
      product_grp_id: symbol.product_grp_id,
    }));

    if (includePrices) {
      // For 'all' endpoint, limit to first 50 symbols to prevent timeout
      const limitedSymbols = symbolsWithPrices.slice(0, 50);
      const symbolsWithPricesLimited =
        await this.addPricesToSymbols(limitedSymbols);

      // Merge back the results
      symbolsWithPrices = [
        ...symbolsWithPricesLimited,
        ...symbolsWithPrices.slice(50),
      ];
    }

    return {
      data: symbolsWithPrices,
      count: symbolsWithPrices.length,
      message: 'Lấy tất cả chứng khoán thành công',
    };
  }

  private async addPricesToSymbols(
    symbols: SymbolResponseDto[],
  ): Promise<SymbolResponseDto[]> {
    const batchSize = 10; // Limit concurrent requests
    const results: SymbolResponseDto[] = [];

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(async (symbol) => {
        const priceData = await this.getCurrentPrice(symbol.symbol);
        return {
          ...symbol,
          currentPrice: priceData.price,
          priceUpdatedAt: priceData.timestamp.toISOString(),
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  async getCurrentPrice(
    symbolCode: string,
  ): Promise<{ price: number | null; timestamp: Date }> {
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
            timeFrame: 'ONE_MINUTE',
            symbols: [symbolCode],
            to: to,
            countBack: 1,
          }),
        },
      );

      if (!response.ok) {
        this.logger.error(
          `HTTP error: ${response.status} for symbol ${symbolCode}`,
        );
        return { price: null, timestamp: new Date() };
      }

      const data: StockPrice[] = await response.json();

      if (data && data.length > 0 && data[0].c && data[0].c.length > 0) {
        return { price: data[0].c[0], timestamp: new Date() };
      }

      return { price: null, timestamp: new Date() };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy giá ${symbolCode}: ${error.message}`);
      return { price: null, timestamp: new Date() };
    }
  }

  private async fetchSymbolsFromVietCap(): Promise<any[]> {
    const vietcapUrl =
      'https://trading.vietcap.com.vn/api/price/symbols/getAll';

    try {
      this.logger.log('Lấy dữ liệu từ VietCap API...');
      const response = await fetch(vietcapUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.logger.log(
          `Lấy thành công ${data.length} mã chứng khoán từ VietCap`,
        );
        return data;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.logger.error(`Lỗi khi lấy dữ liệu từ VietCap: ${error.message}`);
      throw error;
    }
  }
}
