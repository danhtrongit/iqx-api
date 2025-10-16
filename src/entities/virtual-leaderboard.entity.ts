import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('virtual_leaderboard')
@Index(['totalAssetValue', 'updatedAt'])
@Index(['profitLossPercentage', 'updatedAt'])
export class VirtualLeaderboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'portfolio_id' })
  portfolioId: string;

  @Column({ name: 'username' })
  username: string;

  @Column('bigint', { name: 'total_asset_value' })
  totalAssetValue: number;

  @Column('bigint', { name: 'initial_balance', default: 1000000000 })
  initialBalance: number;

  @Column('bigint', { name: 'total_profit_loss' })
  totalProfitLoss: number;

  @Column('decimal', { precision: 5, scale: 2, name: 'profit_loss_percentage' })
  profitLossPercentage: number;

  @Column('int', { name: 'total_transactions' })
  totalTransactions: number;

  @Column('int', { name: 'successful_trades' })
  successfulTrades: number;

  @Column('decimal', { precision: 5, scale: 2, name: 'win_rate', default: 0 })
  winRate: number;

  @Column('int', { name: 'rank_by_value', nullable: true })
  rankByValue?: number;

  @Column('int', { name: 'rank_by_percentage', nullable: true })
  rankByPercentage?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
