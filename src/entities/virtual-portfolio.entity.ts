import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { VirtualHolding } from './virtual-holding.entity';
import { VirtualTransaction } from './virtual-transaction.entity';

@Entity('virtual_portfolios')
export class VirtualPortfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('bigint', {
    name: 'cash_balance',
    default: '10000000000',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  }) // 10 tỷ VND ban đầu
  cashBalance: number;

  @Column('bigint', {
    name: 'total_asset_value',
    default: '10000000000',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  })
  totalAssetValue: number;

  @Column('bigint', {
    name: 'stock_value',
    default: '0',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  })
  stockValue: number;

  @Column('bigint', {
    name: 'total_profit_loss',
    default: '0',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  })
  totalProfitLoss: number;

  @Column('decimal', {
    precision: 10,
    scale: 4,
    name: 'profit_loss_percentage',
    default: 0,
  })
  profitLossPercentage: number;

  @Column('int', { name: 'total_transactions', default: 0 })
  totalTransactions: number;

  @Column('int', { name: 'successful_trades', default: 0 })
  successfulTrades: number;

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.virtualPortfolios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => VirtualHolding, (holding) => holding.portfolio)
  holdings: VirtualHolding[];

  @OneToMany(() => VirtualTransaction, (transaction) => transaction.portfolio)
  transactions: VirtualTransaction[];
}
