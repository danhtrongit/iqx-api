import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { VirtualTransaction } from './virtual-transaction.entity';
import { VirtualHolding } from './virtual-holding.entity';
import { Watchlist } from './watchlist.entity';

@Entity('symbols')
@Index(['symbol'], { unique: true })
export class Symbol {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  symbol: string;

  @Column({ type: 'varchar', length: 255 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  board: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  en_organ_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  organ_short_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  organ_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  product_grp_id: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updated_at: Date;

  // Relations
  @OneToMany(() => VirtualTransaction, (transaction) => transaction.symbol)
  virtualTransactions: VirtualTransaction[];

  @OneToMany(() => VirtualHolding, (holding) => holding.symbol)
  virtualHoldings: VirtualHolding[];

  @OneToMany(() => Watchlist, (watchlist) => watchlist.symbol)
  watchlists: Watchlist[];
}