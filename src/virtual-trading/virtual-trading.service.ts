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
      cashBalance: 10000000000, // 10 tỷ VND
      totalAssetValue: 10000000000,
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

    // Cập nhật giá hiện tại cho tất cả holdings
    await this.updatePortfolioPrices(portfolio.id);

    // Lấy lại portfolio với giá đã cập nhật
    const updatedPortfolio = await this.portfolioRepository.findOne({
      where: { id: portfolio.id },
      relations: ['holdings', 'holdings.symbol'],
    });

    return this.mapToPortfolioSummary(updatedPortfolio!);
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
        marketData: { currentPrice, orderType: sellDto.orderType },
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

  private calculateFee(amount: number): number {
    // Phí môi giới 0.15%
    return Math.floor(amount * 0.0015);
  }

  private calculateTax(amount: number): number {
    // Thuế bán 0.1%
    return Math.floor(amount * 0.001);
  }

  private async updatePortfolioPrices(portfolioId: string): Promise<void> {
    const holdings = await this.holdingRepository.find({
      where: { portfolioId },
    });

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
        holding.lastPriceUpdate = new Date();

        await this.holdingRepository.save(holding);
      }
    }
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
    portfolio.totalProfitLoss = portfolio.totalAssetValue - 10000000000; // So với 10 tỷ ban đầu
    portfolio.profitLossPercentage = Math.min(
      Math.max(
        Number(((portfolio.totalProfitLoss / 10000000000) * 100).toFixed(4)),
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

    return portfolios.map((portfolio, index) => ({
      rank: index + 1,
      userId: portfolio.userId,
      username:
        portfolio.user?.fullName ||
        portfolio.user?.email?.split('@')[0] ||
        'Anonymous',
      totalAssetValue: portfolio.totalAssetValue,
      profitLoss: portfolio.totalProfitLoss,
      profitLossPercentage: portfolio.profitLossPercentage,
      totalTransactions: portfolio.totalTransactions,
      successfulTrades: portfolio.successfulTrades,
      cashBalance: portfolio.cashBalance,
      stockValue: portfolio.stockValue,
      createdAt: portfolio.createdAt,
    }));
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
  ): Promise<{ data: VirtualTransaction[]; meta: any }> {
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

    return {
      data: transactions,
      meta: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };
  }

  private mapToPortfolioSummary(
    portfolio: VirtualPortfolio,
  ): PortfolioSummaryDto {
    return {
      id: portfolio.id,
      userId: portfolio.userId,
      cashBalance: portfolio.cashBalance,
      totalAssetValue: portfolio.totalAssetValue,
      stockValue: portfolio.stockValue,
      totalProfitLoss: portfolio.totalProfitLoss,
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
        })) || [],
    };
  }
}
