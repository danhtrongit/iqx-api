import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { SubscriptionPackage } from './subscription-package.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

@Entity('user_subscriptions')
@Index(['userId', 'status'])
@Index(['expiresAt'])
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'package_id' })
  packageId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ name: 'starts_at', type: 'timestamp' })
  startsAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'auto_renew', default: false })
  autoRenew: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ type: 'varchar', length: 3, nullable: true })
  currency?: string;

  @Column({ name: 'payment_reference', nullable: true })
  paymentReference?: string;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'cancellation_reason', nullable: true })
  cancellationReason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.userSubscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(
    () => SubscriptionPackage,
    (subscriptionPackage) => subscriptionPackage.userSubscriptions,
  )
  @JoinColumn({ name: 'package_id' })
  package: SubscriptionPackage;

  get isActive(): boolean {
    return (
      this.status === SubscriptionStatus.ACTIVE && new Date() < this.expiresAt
    );
  }

  get isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }
}
