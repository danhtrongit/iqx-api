import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VirtualPortfolio } from './virtual-portfolio.entity';
import { Symbol } from './symbol.entity';

@Entity('virtual_holdings')
export class VirtualHolding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'portfolio_id' })
  portfolioId: string;

  @Column('bigint', { name: 'symbol_id' })
  symbolId: number;

  @Column({ name: 'symbol_code' })
  symbolCode: string;

  @Column('int', { name: 'quantity' })
  quantity: number;

  @Column('bigint', {
    name: 'average_price',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  }) // Giá mua trung bình (VND)
  averagePrice: number;

  @Column('bigint', {
    name: 'total_cost',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  }) // Tổng số tiền đã đầu tư
  totalCost: number;

  @Column('bigint', {
    name: 'current_price',
    default: '0',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  }) // Giá hiện tại
  currentPrice: number;

  @Column('bigint', {
    name: 'current_value',
    default: '0',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  }) // Giá trị hiện tại
  currentValue: number;

  @Column('bigint', {
    name: 'unrealized_profit_loss',
    default: '0',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  }) // Lãi/lỗ chưa thực hiện
  unrealizedProfitLoss: number;

  @Column('decimal', {
    precision: 10,
    scale: 4,
    name: 'profit_loss_percentage',
    default: 0,
  })
  profitLossPercentage: number;

  @Column('timestamp', { name: 'last_price_update', nullable: true })
  lastPriceUpdate?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => VirtualPortfolio, (portfolio) => portfolio.holdings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: VirtualPortfolio;

  @ManyToOne(() => Symbol, (symbol) => symbol.virtualHoldings)
  @JoinColumn({ name: 'symbol_id' })
  symbol: Symbol;
}
