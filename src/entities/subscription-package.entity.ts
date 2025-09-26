import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSubscription } from './user-subscription.entity';

@Entity('subscription_packages')
export class SubscriptionPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency: string;

  @Column({ name: 'duration_days' })
  durationDays: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  features?: Record<string, any>;

  @Column({ name: 'max_virtual_portfolios', nullable: true })
  maxVirtualPortfolios?: number;

  @Column({ name: 'daily_api_limit', nullable: true })
  dailyApiLimit?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(
    () => UserSubscription,
    (userSubscription) => userSubscription.package,
  )
  userSubscriptions: UserSubscription[];
}
