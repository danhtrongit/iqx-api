import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { VirtualHolding } from './virtual-holding.entity';
import { VirtualTransaction } from './virtual-transaction.entity';
import { Watchlist } from './watchlist.entity';

@Entity('symbols')
export class Symbol {
  @PrimaryColumn('bigint')
  id: number;

  @Column({ unique: true })
  symbol: string;

  @Column()
  type: string;

  @Column()
  board: string;

  @Column({ name: 'en_organ_name', nullable: true })
  enOrganName?: string;

  @Column({ name: 'organ_short_name', nullable: true })
  organShortName?: string;

  @Column({ name: 'organ_name', nullable: true })
  organName?: string;

  @Column({ name: 'product_grp_id', nullable: true })
  productGrpID?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => VirtualHolding, (holding) => holding.symbol)
  virtualHoldings: VirtualHolding[];

  @OneToMany(() => VirtualTransaction, (transaction) => transaction.symbol)
  virtualTransactions: VirtualTransaction[];

  @OneToMany(() => Watchlist, (watchlist) => watchlist.symbol)
  watchlists: Watchlist[];
}
