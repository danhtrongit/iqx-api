import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Watchlist } from '../entities/watchlist.entity';
import { Symbol } from '../entities/symbol.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(Watchlist)
    private watchlistRepository: Repository<Watchlist>,

    @InjectRepository(Symbol)
    private symbolRepository: Repository<Symbol>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getUserWatchlist(userId: string): Promise<Watchlist[]> {
    return this.watchlistRepository.find({
      where: { userId },
      relations: ['symbol'],
      order: { createdAt: 'DESC' },
    });
  }

  async addToWatchlist(
    userId: string,
    symbolCode: string,
    customName?: string,
    notes?: string,
  ): Promise<Watchlist> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const symbol = await this.symbolRepository.findOne({
      where: { symbol: symbolCode.toUpperCase() },
    });

    if (!symbol) {
      throw new NotFoundException(`Mã chứng khoán ${symbolCode} không tồn tại`);
    }

    const existingWatchlist = await this.watchlistRepository.findOne({
      where: { userId, symbolId: symbol.id },
    });

    if (existingWatchlist) {
      throw new ConflictException(
        `Mã chứng khoán ${symbolCode} đã có trong danh sách yêu thích`,
      );
    }

    const watchlistItem = new Watchlist();
    watchlistItem.userId = userId;
    watchlistItem.symbolId = symbol.id;
    if (customName) watchlistItem.customName = customName;
    if (notes) watchlistItem.notes = notes;

    return this.watchlistRepository.save(watchlistItem);
  }

  async removeFromWatchlist(
    userId: string,
    watchlistId: string,
  ): Promise<void> {
    const watchlistItem = await this.watchlistRepository.findOne({
      where: { id: watchlistId, userId },
    });

    if (!watchlistItem) {
      throw new NotFoundException(
        'Mục yêu thích không tồn tại hoặc không thuộc về bạn',
      );
    }

    await this.watchlistRepository.remove(watchlistItem);
  }

  async removeBySymbolCode(userId: string, symbolCode: string): Promise<void> {
    const symbol = await this.symbolRepository.findOne({
      where: { symbol: symbolCode.toUpperCase() },
    });

    if (!symbol) {
      throw new NotFoundException(`Mã chứng khoán ${symbolCode} không tồn tại`);
    }

    const watchlistItem = await this.watchlistRepository.findOne({
      where: { userId, symbolId: symbol.id },
    });

    if (!watchlistItem) {
      throw new NotFoundException(
        `Mã chứng khoán ${symbolCode} không có trong danh sách yêu thích`,
      );
    }

    await this.watchlistRepository.remove(watchlistItem);
  }

  async updateWatchlistItem(
    userId: string,
    watchlistId: string,
    updates: {
      customName?: string;
      notes?: string;
      alertPriceHigh?: number;
      alertPriceLow?: number;
      isAlertEnabled?: boolean;
    },
  ): Promise<Watchlist> {
    const watchlistItem = await this.watchlistRepository.findOne({
      where: { id: watchlistId, userId },
      relations: ['symbol'],
    });

    if (!watchlistItem) {
      throw new NotFoundException(
        'Mục yêu thích không tồn tại hoặc không thuộc về bạn',
      );
    }

    if (
      updates.alertPriceHigh !== undefined &&
      updates.alertPriceLow !== undefined
    ) {
      if (updates.alertPriceHigh <= updates.alertPriceLow) {
        throw new BadRequestException(
          'Giá cảnh báo cao phải lớn hơn giá cảnh báo thấp',
        );
      }
    }

    Object.assign(watchlistItem, updates);

    return this.watchlistRepository.save(watchlistItem);
  }

  async isInWatchlist(userId: string, symbolCode: string): Promise<boolean> {
    const symbol = await this.symbolRepository.findOne({
      where: { symbol: symbolCode.toUpperCase() },
    });

    if (!symbol) {
      return false;
    }

    const watchlistItem = await this.watchlistRepository.findOne({
      where: { userId, symbolId: symbol.id },
    });

    return !!watchlistItem;
  }

  async getWatchlistItem(
    userId: string,
    symbolCode: string,
  ): Promise<Watchlist | null> {
    const symbol = await this.symbolRepository.findOne({
      where: { symbol: symbolCode.toUpperCase() },
    });

    if (!symbol) {
      return null;
    }

    return this.watchlistRepository.findOne({
      where: { userId, symbolId: symbol.id },
      relations: ['symbol'],
    });
  }

  async getUserWatchlistCount(userId: string): Promise<number> {
    return this.watchlistRepository.count({
      where: { userId },
    });
  }

  async getUserWatchlistWithAlerts(userId: string): Promise<Watchlist[]> {
    return this.watchlistRepository.find({
      where: { userId, isAlertEnabled: true },
      relations: ['symbol'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPopularWatchlistSymbols(
    limit: number = 10,
  ): Promise<Array<{ symbol: Symbol; count: number }>> {
    const result = await this.watchlistRepository
      .createQueryBuilder('watchlist')
      .leftJoinAndSelect('watchlist.symbol', 'symbol')
      .select(['symbol', 'COUNT(watchlist.id) as count'])
      .groupBy(
        'symbol.id, symbol.symbol, symbol.organName, symbol.organShortName, symbol.type, symbol.board, symbol.createdAt, symbol.updatedAt',
      )
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((item) => ({
      symbol: {
        id: item.symbol_id,
        symbol: item.symbol_symbol,
        organName: item.symbol_organName,
        organShortName: item.symbol_organShortName,
        type: item.symbol_type,
        board: item.symbol_board,
        createdAt: item.symbol_createdAt,
        updatedAt: item.symbol_updatedAt,
      } as Symbol,
      count: parseInt(item.count),
    }));
  }

  async clearUserWatchlist(userId: string): Promise<number> {
    const result = await this.watchlistRepository.delete({ userId });
    return result.affected || 0;
  }
}
