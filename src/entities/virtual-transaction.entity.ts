import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { VirtualPortfolio } from './virtual-portfolio.entity';
import { Symbol } from './symbol.entity';

export enum VirtualTransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum VirtualTransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('virtual_transactions')
@Index(['portfolioId', 'createdAt'])
@Index(['symbolCode', 'createdAt'])
export class VirtualTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'portfolio_id' })
  portfolioId: string;

  @Column('bigint', { name: 'symbol_id' })
  symbolId: number;

  @Column({ name: 'symbol_code' })
  symbolCode: string;

  @Column('enum', { enum: VirtualTransactionType, name: 'transaction_type' })
  transactionType: VirtualTransactionType;

  @Column('int', { name: 'quantity' })
  quantity: number;

  @Column('bigint', {
    name: 'price_per_share',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  }) // Giá mỗi cổ phiếu (VND)
  pricePerShare: number;

  @Column('bigint', {
    name: 'total_amount',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  }) // Tổng số tiền giao dịch
  totalAmount: number;

  @Column('bigint', {
    name: 'fee',
    default: '0',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  }) // Phí giao dịch
  fee: number;

  @Column('bigint', {
    name: 'tax',
    default: '0',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  }) // Thuế (đối với bán)
  tax: number;

  @Column('bigint', {
    name: 'net_amount',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  }) // Số tiền thực tế (sau phí và thuế)
  netAmount: number;

  @Column('enum', {
    enum: VirtualTransactionStatus,
    name: 'status',
    default: VirtualTransactionStatus.PENDING,
  })
  status: VirtualTransactionStatus;

  @Column('text', { name: 'failure_reason', nullable: true })
  failureReason?: string;

  @Column('json', { name: 'market_data', nullable: true })
  marketData?: any; // Dữ liệu thị trường tại thời điểm giao dịch

  @Column('bigint', {
    name: 'portfolio_balance_before',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  })
  portfolioBalanceBefore: number;

  @Column('bigint', {
    name: 'portfolio_balance_after',
    transformer: {
      to: (value: number) => value.toString(),
      from: (value: string) => parseInt(value, 10),
    },
  })
  portfolioBalanceAfter: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column('timestamp', { name: 'executed_at', nullable: true })
  executedAt?: Date;

  @ManyToOne(() => VirtualPortfolio, (portfolio) => portfolio.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: VirtualPortfolio;

  @ManyToOne(() => Symbol, (symbol) => symbol.virtualTransactions)
  @JoinColumn({ name: 'symbol_id' })
  symbol: Symbol;
}
