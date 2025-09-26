import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Symbol } from './symbol.entity';

@Entity('watchlists')
@Unique(['userId', 'symbolId'])
@Index(['userId'])
@Index(['symbolId'])
export class Watchlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('bigint', { name: 'symbol_id' })
  symbolId: number;

  @Column({ name: 'custom_name', nullable: true })
  customName?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    name: 'alert_price_high',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  alertPriceHigh?: number;

  @Column({
    name: 'alert_price_low',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  alertPriceLow?: number;

  @Column({ name: 'is_alert_enabled', default: false })
  isAlertEnabled: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.watchlists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Symbol, (symbol) => symbol.watchlists, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'symbol_id' })
  symbol: Symbol;
}
