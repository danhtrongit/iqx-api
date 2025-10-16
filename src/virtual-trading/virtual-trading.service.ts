import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VirtualPortfolio } from '../entities/virtual-portfolio.entity';
import { VirtualHolding } from '../entities/virtual-holding.entity';
import {
  VirtualTransaction,
  VirtualTransactionType,
  VirtualTransactionStatus,
} from '../entities/virtual-transaction.entity';
import { Symbol } from '../entities/symbol.entity';
import { User } from '../entities/user.entity';
import {
  BuyStockDto,
  SellStockDto,
  PortfolioSummaryDto,
  StockPrice,
} from './dto/virtual-trading.dto';

@Injectable()
export class VirtualTradingService {
  private readonly logger = new Logger(VirtualTradingService.name);

  constructor(
    @InjectRepository(VirtualPortfolio)
    private portfolioRepository: Repository<VirtualPortfolio>,
    @InjectRepository(VirtualHolding)
    private holdingRepository: Repository<VirtualHolding>,
    @InjectRepository(VirtualTransaction)
    private transactionRepository: Repository<VirtualTransaction>,
    @InjectRepository(Symbol)
    private symbolRepository: Repository<Symbol>,
    private dataSource: DataSource,
  ) {}

  async createPortfolio(userId: string): Promise<VirtualPortfolio> {
    const existingPortfolio = await this.portfolioRepository.findOne({
      where: { userId, isActive: true },
    });

    if (existingPortfolio) {
      return existingPortfolio;
    }

    const portfolio = this.portfolioRepository.create({
      userId,
      cashBalance: 1000000000, // 1 tỷ VND
      totalAssetValue: 1000000000,
      stockValue: 0,
      totalProfitLoss: 0,
      profitLossPercentage: 0,
    });

    return await this.portfolioRepository.save(portfolio);
  }

  async getPortfolio(userId: string): Promise<PortfolioSummaryDto | null> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { userId, isActive: true },
      relations: ['holdings', 'holdings.symbol'],
    });

    if (!portfolio) {
      return null;
    }

    // Cập nhật giá hiện tại cho tất cả holdings và lấy giá hôm qua
    const yesterdayPriceMap = await this.updatePortfolioPrices(portfolio.id);

    // Lấy lại portfolio với giá đã cập nhật
    const updatedPortfolio = await this.portfolioRepository.findOne({
      where: { id: portfolio.id },
      relations: ['holdings', 'holdings.symbol'],
    });

    return await this.mapToPortfolioSummary(updatedPortfolio!, yesterdayPriceMap);
  }

  async buyStock(
    userId: string,
    buyDto: BuyStockDto,
  ): Promise<VirtualTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lấy portfolio
      const portfolio = await queryRunner.manager.findOne(VirtualPortfolio, {
        where: { userId, isActive: true },
      });

      if (!portfolio) {
        throw new NotFoundException('Portfolio không tồn tại');
      }

      // Lấy thông tin symbol
      const symbol = await queryRunner.manager.findOne(Symbol, {
        where: { symbol: buyDto.symbolCode.toUpperCase() },
      });

      if (!symbol) {
        throw new NotFoundException(
          `Symbol ${buyDto.symbolCode} không tồn tại`,
        );
      }

      // Lấy giá hiện tại từ VietCap
      const currentPrice = await this.getCurrentPrice(symbol.symbol);
      if (!currentPrice) {
        throw new BadRequestException(
          'Không thể lấy giá hiện tại của mã chứng khoán',
        );
      }

      const pricePerShare =
        buyDto.orderType === 'LIMIT' && buyDto.limitPrice
          ? buyDto.limitPrice
          : currentPrice;

      const totalAmount = buyDto.quantity * pricePerShare;
      const fee = this.calculateFee(totalAmount);
      const netAmount = totalAmount + fee;

      // Kiểm tra số dư
      if (portfolio.cashBalance < netAmount) {
        throw new BadRequestException('Số dư không đủ để thực hiện giao dịch');
      }

      // Tạo transaction
      const transaction = queryRunner.manager.create(VirtualTransaction, {
        portfolioId: portfolio.id,
        symbolId: symbol.id,
        symbolCode: symbol.symbol,
        transactionType: VirtualTransactionType.BUY,
        quantity: buyDto.quantity,
        pricePerShare,
        totalAmount,
        fee,
        tax: 0,
        netAmount,
        status: VirtualTransactionStatus.COMPLETED,
        portfolioBalanceBefore: portfolio.cashBalance,
        portfolioBalanceAfter: portfolio.cashBalance - netAmount,
        executedAt: new Date(),
        marketData: { currentPrice, orderType: buyDto.orderType },
      });

      await queryRunner.manager.save(transaction);

      // Cập nhật portfolio
      portfolio.cashBalance -= netAmount;
      portfolio.totalTransactions += 1;
      portfolio.successfulTrades += 1;
      await queryRunner.manager.save(portfolio);

      // Cập nhật hoặc tạo holding
      let holding = await queryRunner.manager.findOne(VirtualHolding, {
        where: { portfolioId: portfolio.id, symbolCode: symbol.symbol },
      });

      if (holding) {
        // Cập nhật holding existing
        const newTotalCost = holding.totalCost + totalAmount;
        const newQuantity = holding.quantity + buyDto.quantity;
        holding.averagePrice = Math.floor(newTotalCost / newQuantity);
        holding.quantity = newQuantity;
        holding.totalCost = newTotalCost;
      } else {
        // Tạo holding mới
        holding = queryRunner.manager.create(VirtualHolding, {
          portfolioId: portfolio.id,
          symbolId: symbol.id,
          symbolCode: symbol.symbol,
          quantity: buyDto.quantity,
          averagePrice: pricePerShare,
          totalCost: totalAmount,
          currentPrice: currentPrice,
          currentValue: buyDto.quantity * currentPrice,
          unrealizedProfitLoss: 0,
          profitLossPercentage: 0,
        });
      }

      await queryRunner.manager.save(holding);

      // Cập nhật tổng giá trị portfolio
      await this.recalculatePortfolioValue(portfolio.id, queryRunner.manager);

      await queryRunner.commitTransaction();

      this.logger.log(
        `User ${userId} mua ${buyDto.quantity} cổ phiếu ${symbol.symbol} với giá ${pricePerShare}`,
      );

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Lỗi khi mua cổ phiếu: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async sellStock(
    userId: string,
    sellDto: SellStockDto,
  ): Promise<VirtualTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lấy portfolio và holding
      const portfolio = await queryRunner.manager.findOne(VirtualPortfolio, {
        where: { userId, isActive: true },
      });

      if (!portfolio) {
        throw new NotFoundException('Portfolio không tồn tại');
      }

      const holding = await queryRunner.manager.findOne(VirtualHolding, {
        where: {
          portfolioId: portfolio.id,
          symbolCode: sellDto.symbolCode.toUpperCase(),
        },
      });

      if (!holding || holding.quantity < sellDto.quantity) {
        throw new BadRequestException('Không đủ số lượng cổ phiếu để bán');
      }

      const symbol = await queryRunner.manager.findOne(Symbol, {
        where: { symbol: sellDto.symbolCode.toUpperCase() },
      });

      if (!symbol) {
        throw new NotFoundException(
          `Symbol ${sellDto.symbolCode} không tồn tại`,
        );
      }

      // Lấy giá hiện tại
      const currentPrice = await this.getCurrentPrice(symbol.symbol);
      if (!currentPrice) {
        throw new BadRequestException(
          'Không thể lấy giá hiện tại của mã chứng khoán',
        );
      }

      const pricePerShare =
        sellDto.orderType === 'LIMIT' && sellDto.limitPrice
          ? sellDto.limitPrice
          : currentPrice;

      const totalAmount = sellDto.quantity * pricePerShare;
      const fee = this.calculateFee(totalAmount);
      const tax = this.calculateTax(totalAmount);
      const netAmount = totalAmount - fee - tax;

      // Tạo transaction
      const transaction = queryRunner.manager.create(VirtualTransaction, {
        portfolioId: portfolio.id,
        symbolId: symbol.id,
        symbolCode: symbol.symbol,
        transactionType: VirtualTransactionType.SELL,
        quantity: sellDto.quantity,
        pricePerShare,
        totalAmount,
        fee,
        tax,
        netAmount,
        status: VirtualTransactionStatus.COMPLETED,
        portfolioBalanceBefore: portfolio.cashBalance,
        portfolioBalanceAfter: portfolio.cashBalance + netAmount,
        executedAt: new Date(),
        marketData: { 
          currentPrice, 
          orderType: sellDto.orderType,
          averagePriceAtSell: holding.averagePrice // Lưu giá mua trung bình tại thời điểm bán
        },
      });

      await queryRunner.manager.save(transaction);

      // Cập nhật portfolio
      portfolio.cashBalance += netAmount;
      portfolio.totalTransactions += 1;
      portfolio.successfulTrades += 1;
      await queryRunner.manager.save(portfolio);

      // Cập nhật holding
      holding.quantity -= sellDto.quantity;
      const soldCost = Math.floor(
        (holding.totalCost * sellDto.quantity) /
          (holding.quantity + sellDto.quantity),
      );
      holding.totalCost -= soldCost;

      if (holding.quantity === 0) {
        await queryRunner.manager.remove(holding);
      } else {
        await queryRunner.manager.save(holding);
      }

      // Cập nhật tổng giá trị portfolio
      await this.recalculatePortfolioValue(portfolio.id, queryRunner.manager);

      await queryRunner.commitTransaction();

      this.logger.log(
        `User ${userId} bán ${sellDto.quantity} cổ phiếu ${symbol.symbol} với giá ${pricePerShare}`,
      );

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Lỗi khi bán cổ phiếu: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async getCurrentPrice(symbolCode: string): Promise<number | null> {
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
        return null;
      }

      const data: StockPrice[] = await response.json();

      if (data && data.length > 0 && data[0].c && data[0].c.length > 0) {
        return data[0].c[0]; // Giá close hiện tại
      }

      return null;
    } catch (error) {
      this.logger.error(`Lỗi khi lấy giá ${symbolCode}: ${error.message}`);
      return null;
    }
  }

  private async getHistoricalPrices(
    symbolCodes: string[],
  ): Promise<Map<string, { currentPrice: number | null; yesterdayPrice: number | null }>> {
    const priceMap = new Map<string, { currentPrice: number | null; yesterdayPrice: number | null }>();
    
    if (symbolCodes.length === 0) {
      return priceMap;
    }

    try {
      const now = Date.now();
      const to = Math.floor(now / 1000);
      const countBack = symbolCodes.length * 2;

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
            symbols: symbolCodes,
            to: to,
            countBack: countBack,
          }),
        },
      );

      console.log(response);

      if (!response.ok) {
        this.logger.error(
          `HTTP error: ${response.status} when fetching historical prices`,
        );
        return priceMap;
      }

      const data: StockPrice[] = await response.json();

      // Xử lý dữ liệu cho từng symbol
      for (const stockData of data) {
        // Lấy symbol code từ trường 's' hoặc 'symbol'
        const symbolCode = stockData.s || stockData.symbol;
        
        if (!symbolCode) {
          this.logger.warn('Symbol code not found in API response', stockData);
          continue;
        }

        let currentPrice: number | null = null;
        let yesterdayPrice: number | null = null;

        // Lấy giá gần nhất (hôm nay hoặc ngày giao dịch gần nhất)
        // API trả về mảng theo thứ tự từ cũ đến mới (oldest to newest)
        if (stockData.c && stockData.c.length > 0) {
          const lastIndex = stockData.c.length - 1;
          currentPrice = stockData.c[lastIndex]; // Phần tử cuối = giá hiện tại (mới nhất)
          
          // Lấy giá ngày hôm qua (phần tử áp chót)
          if (lastIndex > 0) {
            yesterdayPrice = stockData.c[lastIndex - 1];
          }
        }

        this.logger.debug(`Symbol ${symbolCode}: current=${currentPrice}, yesterday=${yesterdayPrice}`);
        priceMap.set(symbolCode, { currentPrice, yesterdayPrice });
      }

      return priceMap;
    } catch (error) {
      this.logger.error(`Lỗi khi lấy giá lịch sử: ${error.message}`);
      return priceMap;
    }
  }

  private calculateFee(amount: number): number {
    // Phí môi giới 0.01%
    return Math.floor(amount * 0.0001);
  }

  private calculateTax(amount: number): number {
    // Thuế bán 0.1%
    return Math.floor(amount * 0.001);
  }

  private async updatePortfolioPrices(portfolioId: string): Promise<Map<string, number | null>> {
    const holdings = await this.holdingRepository.find({
      where: { portfolioId },
    });

    const yesterdayPriceMap = new Map<string, number | null>();

    if (holdings.length === 0) {
      return yesterdayPriceMap;
    }

    // Lấy danh sách tất cả symbol codes
    const symbolCodes = holdings.map(h => h.symbolCode);
    
    // Gọi API để lấy giá hiện tại và giá hôm qua
    const pricesMap = await this.getHistoricalPrices(symbolCodes);

    // Cập nhật từng holding
    for (const holding of holdings) {
      const prices = pricesMap.get(holding.symbolCode);
      
      if (prices && prices.currentPrice) {
        holding.currentPrice = prices.currentPrice;
        holding.currentValue = holding.quantity * prices.currentPrice;
        holding.unrealizedProfitLoss = holding.currentValue - holding.totalCost;
        holding.profitLossPercentage =
          holding.totalCost > 0
            ? Math.min(
                Math.max(
                  Number(
                    (
                      (holding.unrealizedProfitLoss / holding.totalCost) *
                      100
                    ).toFixed(4),
                  ),
                  -999999.9999,
                ),
                999999.9999,
              )
            : 0;
        holding.lastPriceUpdate = new Date();

        await this.holdingRepository.save(holding);
        
        // Lưu giá hôm qua vào map để trả về (có thể null)
        yesterdayPriceMap.set(holding.symbolCode, prices.yesterdayPrice);
      } else {
        // Nếu không lấy được giá hiện tại, vẫn thêm null cho yesterdayPrice
        this.logger.warn(`Cannot get current price for ${holding.symbolCode}`);
        yesterdayPriceMap.set(holding.symbolCode, null);
      }
    }

    return yesterdayPriceMap;
  }

  private async recalculatePortfolioValue(
    portfolioId: string,
    manager: any,
  ): Promise<void> {
    const holdings = await manager.find(VirtualHolding, {
      where: { portfolioId },
    });
    const portfolio = await manager.findOne(VirtualPortfolio, {
      where: { id: portfolioId },
    });

    if (!portfolio) return;

    let totalStockValue = 0;

    for (const holding of holdings) {
      const currentPrice = await this.getCurrentPrice(holding.symbolCode);
      if (currentPrice) {
        holding.currentPrice = currentPrice;
        holding.currentValue = holding.quantity * currentPrice;
        holding.unrealizedProfitLoss = holding.currentValue - holding.totalCost;
        holding.profitLossPercentage =
          holding.totalCost > 0
            ? Math.min(
                Math.max(
                  Number(
                    (
                      (holding.unrealizedProfitLoss / holding.totalCost) *
                      100
                    ).toFixed(4),
                  ),
                  -999999.9999,
                ),
                999999.9999,
              )
            : 0;

        await manager.save(holding);
        totalStockValue += holding.currentValue;
      }
    }

    portfolio.stockValue = totalStockValue;
    portfolio.totalAssetValue = portfolio.cashBalance + totalStockValue;
    portfolio.totalProfitLoss = portfolio.totalAssetValue - 1000000000; // So với 1 tỷ ban đầu
    portfolio.profitLossPercentage = Math.min(
      Math.max(
        Number(((portfolio.totalProfitLoss / 1000000000) * 100).toFixed(4)),
        -999999.9999,
      ),
      999999.9999,
    );

    await manager.save(portfolio);
  }

  async getLeaderboard(
    limit: number = 50,
    sortBy: 'value' | 'percentage' = 'percentage',
  ): Promise<any[]> {
    // Validate and sanitize parameters
    const validLimit = Math.max(
      1,
      Math.min(100, Math.floor(Number(limit)) || 50),
    );

    const queryBuilder = this.portfolioRepository
      .createQueryBuilder('portfolio')
      .leftJoinAndSelect('portfolio.user', 'user')
      .leftJoinAndSelect('portfolio.holdings', 'holdings')
      .where('portfolio.isActive = :isActive', { isActive: true })
      .andWhere('portfolio.totalTransactions > :minTransactions', {
        minTransactions: 0,
      });

    // Sort by the specified criteria
    if (sortBy === 'value') {
      queryBuilder.orderBy('portfolio.totalAssetValue', 'DESC');
    } else {
      queryBuilder.orderBy('portfolio.profitLossPercentage', 'DESC');
    }

    queryBuilder
      .addOrderBy('portfolio.totalAssetValue', 'DESC')
      .limit(validLimit);

    const portfolios = await queryBuilder.getMany();

    return portfolios.map((portfolio, index) => {
      // Tính unrealized profit/loss từ holdings
      let unrealizedProfitLoss = 0;
      if (portfolio.holdings) {
        for (const holding of portfolio.holdings) {
          unrealizedProfitLoss += holding.unrealizedProfitLoss;
        }
      }

      // Tính realized profit/loss
      const realizedProfitLoss = portfolio.totalProfitLoss - unrealizedProfitLoss;

      return {
        rank: index + 1,
        userId: portfolio.userId,
        username:
          portfolio.user?.fullName ||
          portfolio.user?.email?.split('@')[0] ||
          'Anonymous',
        totalAssetValue: portfolio.totalAssetValue,
        profitLoss: portfolio.totalProfitLoss,
        unrealizedProfitLoss,
        realizedProfitLoss,
        profitLossPercentage: portfolio.profitLossPercentage,
        totalTransactions: portfolio.totalTransactions,
        successfulTrades: portfolio.successfulTrades,
        cashBalance: portfolio.cashBalance,
        stockValue: portfolio.stockValue,
        createdAt: portfolio.createdAt,
      };
    });
  }

  async getStockPrice(
    symbolCode: string,
  ): Promise<{ currentPrice: number | null; timestamp: Date }> {
    const currentPrice = await this.getCurrentPrice(symbolCode.toUpperCase());

    return {
      currentPrice,
      timestamp: new Date(),
    };
  }

  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: 'BUY' | 'SELL',
  ): Promise<{ data: any[]; meta: any }> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { userId, isActive: true },
    });

    if (!portfolio) {
      return {
        data: [],
        meta: { page, limit, total: 0, totalPages: 0 },
      };
    }

    // Validate and sanitize pagination parameters
    const validPage = Math.max(1, Math.floor(Number(page)) || 1);
    const validLimit = Math.max(
      1,
      Math.min(100, Math.floor(Number(limit)) || 20),
    );

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.symbol', 'symbol')
      .where('transaction.portfolioId = :portfolioId', {
        portfolioId: portfolio.id,
      })
      .orderBy('transaction.executedAt', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC');

    if (type) {
      queryBuilder.andWhere('transaction.transactionType = :type', { type });
    }

    const offset = (validPage - 1) * validLimit;
    queryBuilder.skip(offset).take(validLimit);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    // Process transactions to add average cost for all transactions
    const processedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const result: any = {
          ...transaction,
        };

        const transactionDate = transaction.executedAt || transaction.createdAt;

        if (transaction.transactionType === VirtualTransactionType.SELL) {
          // For SELL: show average cost before selling (giá vốn trước khi bán)
          const averageCostBeforeSell = await this.getLatestAverageCost(
            transaction.portfolioId,
            transaction.symbolCode,
            transactionDate,
          );

          if (averageCostBeforeSell) {
            result.averageCost = averageCostBeforeSell; // Giá vốn TB trước khi bán
            result.totalCost = averageCostBeforeSell * transaction.quantity; // Tổng giá vốn
            result.profitLoss = transaction.netAmount - (averageCostBeforeSell * transaction.quantity); // Lãi/lỗ
            result.profitLossPercentage = ((transaction.pricePerShare - averageCostBeforeSell) / averageCostBeforeSell) * 100; // % lãi/lỗ
          }
        } else if (transaction.transactionType === VirtualTransactionType.BUY) {
          // For BUY: calculate new average cost after buying (giá vốn sau khi mua)
          const averageCostAfterBuy = await this.calculateAverageCostAfterBuy(
            transaction.portfolioId,
            transaction.symbolCode,
            transactionDate,
            transaction.quantity,
            transaction.pricePerShare,
          );

          if (averageCostAfterBuy) {
            result.averageCost = averageCostAfterBuy; // Giá vốn TB sau khi mua
          }
        }

        return result;
      }),
    );

    return {
      data: processedTransactions,
      meta: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };
  }

  private async calculateAverageCostAfterBuy(
    portfolioId: string,
    symbolCode: string,
    buyDate: Date,
    newQuantity: number,
    newPrice: number,
  ): Promise<number | null> {
    /**
     * Tính giá vốn TB sau khi mua thêm
     * Công thức: Giá vốn mới = (Tổng giá trị cũ còn lại + Giá mua mới × SL mới) / (SL cũ còn lại + SL mới)
     * 
     * Ví dụ từ bảng:
     * 14/10: Mua 12,000 CP giá 90,500
     * - SL cũ: 8,000 CP (giá vốn 89,500)
     * - Giá vốn mới = (89,500×8,000 + 90,500×12,000) / (8,000 + 12,000) = 90,100
     */

    // Lấy tất cả giao dịch BUY và SELL trước thời điểm này để tính số lượng và giá vốn hiện tại
    const [buyTransactions, sellTransactions] = await Promise.all([
      this.transactionRepository.find({
        where: {
          portfolioId,
          symbolCode,
          transactionType: VirtualTransactionType.BUY,
          status: VirtualTransactionStatus.COMPLETED,
        },
        order: { executedAt: 'ASC' },
      }),
      this.transactionRepository.find({
        where: {
          portfolioId,
          symbolCode,
          transactionType: VirtualTransactionType.SELL,
          status: VirtualTransactionStatus.COMPLETED,
        },
        order: { executedAt: 'ASC' },
      }),
    ]);

    // Tính tổng số lượng MUA và tổng giá trị MUA trước thời điểm này
    let totalBuyQuantity = 0;
    let totalBuyCost = 0;

    for (const buy of buyTransactions) {
      const previousBuyDate = buy.executedAt || buy.createdAt;
      if (previousBuyDate < buyDate) {
        totalBuyQuantity += buy.quantity;
        totalBuyCost += buy.quantity * buy.pricePerShare;
      }
    }

    // Trừ đi số lượng đã bán
    let totalSoldQuantity = 0;
    for (const sell of sellTransactions) {
      const sellDate = sell.executedAt || sell.createdAt;
      if (sellDate < buyDate) {
        totalSoldQuantity += sell.quantity;
      }
    }

    // Số lượng còn lại trước khi mua thêm
    const remainingQuantity = totalBuyQuantity - totalSoldQuantity;

    // Nếu không có cổ phiếu cũ, giá vốn mới = giá mua hiện tại
    if (remainingQuantity <= 0 || totalBuyQuantity <= 0) {
      return newPrice;
    }

    // Giá vốn TB hiện tại (trước khi mua thêm)
    const currentAverageCost = totalBuyCost / totalBuyQuantity;
    
    // Tính giá vốn mới sau khi mua thêm
    // Giá vốn mới = (Giá vốn cũ × SL còn lại + Giá mua mới × SL mới) / (SL còn lại + SL mới)
    const newTotalQuantity = remainingQuantity + newQuantity;
    const newTotalCost = (currentAverageCost * remainingQuantity) + (newPrice * newQuantity);
    const newAverageCost = Math.floor(newTotalCost / newTotalQuantity);

    return newAverageCost;
  }

  private async getLatestAverageCost(
    portfolioId: string,
    symbolCode: string,
    transactionDate: Date,
  ): Promise<number | null> {
    /**
     * Lấy giá vốn TB từ lần mua gần nhất trước thời điểm này
     * Không cần tính lại từ đầu, chỉ cần lấy giá vốn đã được tính sau lần BUY gần nhất
     */

    // Tìm lần mua gần nhất trước thời điểm này
    const latestBuyBeforeDate = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.portfolioId = :portfolioId', { portfolioId })
      .andWhere('transaction.symbolCode = :symbolCode', { symbolCode })
      .andWhere('transaction.transactionType = :type', { type: VirtualTransactionType.BUY })
      .andWhere('transaction.status = :status', { status: VirtualTransactionStatus.COMPLETED })
      .andWhere('(transaction.executedAt < :date OR (transaction.executedAt IS NULL AND transaction.createdAt < :date))', { date: transactionDate })
      .orderBy('transaction.executedAt', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .getOne();

    if (!latestBuyBeforeDate) {
      return null;
    }

    // Tính giá vốn sau lần mua gần nhất này
    const buyDate = latestBuyBeforeDate.executedAt || latestBuyBeforeDate.createdAt;
    const averageCost = await this.calculateAverageCostAfterBuy(
      portfolioId,
      symbolCode,
      buyDate,
      latestBuyBeforeDate.quantity,
      latestBuyBeforeDate.pricePerShare,
    );

    return averageCost;
  }


  private async calculateRealizedProfitLoss(
    portfolioId: string,
  ): Promise<number> {
    // Tính realized profit/loss từ tất cả các giao dịch SELL
    const sellTransactions = await this.transactionRepository.find({
      where: {
        portfolioId,
        transactionType: VirtualTransactionType.SELL,
        status: VirtualTransactionStatus.COMPLETED,
      },
    });

    let totalRealizedPL = 0;
    
    for (const transaction of sellTransactions) {
      // Tính lãi/lỗ thực hiện: Tiền nhận được - Giá vốn
      // Giá vốn = giá mua trung bình (lưu trong marketData) * số lượng
      const averagePriceAtSell = transaction.marketData?.averagePriceAtSell;

      if (averagePriceAtSell) {
        const costBasis = averagePriceAtSell * transaction.quantity;
        const realizedPL = transaction.netAmount - costBasis;
        totalRealizedPL += realizedPL;
      }
    }
    return totalRealizedPL;

  }

  private async mapToPortfolioSummary(
    portfolio: VirtualPortfolio,
    yesterdayPriceMap?: Map<string, number | null>,
  ): Promise<PortfolioSummaryDto> {
    // Tính unrealized profit/loss từ holdings
    let unrealizedProfitLoss = 0;
    if (portfolio.holdings) {
      for (const holding of portfolio.holdings) {
        unrealizedProfitLoss += holding.unrealizedProfitLoss;
      }
    }

    // Tính realized profit/loss từ các giao dịch SELL
    const realizedProfitLoss = await this.calculateRealizedProfitLoss(portfolio.id);

    return {
      id: portfolio.id,
      userId: portfolio.userId,
      cashBalance: portfolio.cashBalance,
      totalAssetValue: portfolio.totalAssetValue,
      stockValue: portfolio.stockValue,
      totalProfitLoss: portfolio.totalProfitLoss,
      unrealizedProfitLoss,
      realizedProfitLoss,
      profitLossPercentage: portfolio.profitLossPercentage,
      totalTransactions: portfolio.totalTransactions,
      successfulTrades: portfolio.successfulTrades,
      holdings:
        portfolio.holdings?.map((holding) => ({
          id: holding.id,
          symbolCode: holding.symbolCode,
          symbolName: holding.symbol?.organ_short_name || holding.symbolCode,
          quantity: holding.quantity,
          averagePrice: holding.averagePrice,
          currentPrice: holding.currentPrice,
          currentValue: holding.currentValue,
          unrealizedProfitLoss: holding.unrealizedProfitLoss,
          profitLossPercentage: holding.profitLossPercentage,
          totalCost: holding.totalCost,
          yesterdayPrice: yesterdayPriceMap?.get(holding.symbolCode) || null,
        })) || [],
    };
  }
}
