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
import { UserSubscription } from './user-subscription.entity';
import { UserApiExtension } from './user-api-extension.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  PAYOS = 'payos',
  BANK_TRANSFER = 'bank_transfer',
  OTHER = 'other',
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  EXTENSION = 'extension',
}

@Entity('payments')
@Index(['userId', 'status'])
@Index(['orderCode'])
@Index(['paymentLinkId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId: string;

  @Column({ name: 'subscription_id', type: 'varchar', length: 255, nullable: true })
  subscriptionId?: string;

  @Column({ name: 'extension_id', type: 'varchar', length: 255, nullable: true })
  extensionId?: string;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.SUBSCRIPTION,
    name: 'payment_type',
  })
  paymentType: PaymentType;

  @Column({ name: 'package_id', type: 'varchar', length: 255, nullable: true })
  packageId?: string;

  @Column({ name: 'order_code', type: 'bigint', unique: true })
  orderCode: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.PAYOS,
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_link_id', nullable: true })
  paymentLinkId?: string;

  @Column({ name: 'checkout_url', type: 'text', nullable: true })
  checkoutUrl?: string;

  @Column({ name: 'qr_code', type: 'text', nullable: true })
  qrCode?: string;

  @Column({ name: 'account_number', nullable: true })
  accountNumber?: string;

  @Column({ name: 'reference', nullable: true })
  reference?: string;

  @Column({ name: 'transaction_date_time', type: 'timestamp', nullable: true })
  transactionDateTime?: Date;

  @Column({ name: 'counter_account_bank_id', nullable: true })
  counterAccountBankId?: string;

  @Column({ name: 'counter_account_bank_name', nullable: true })
  counterAccountBankName?: string;

  @Column({ name: 'counter_account_name', nullable: true })
  counterAccountName?: string;

  @Column({ name: 'counter_account_number', nullable: true })
  counterAccountNumber?: string;

  @Column({ name: 'virtual_account_name', nullable: true })
  virtualAccountName?: string;

  @Column({ name: 'virtual_account_number', nullable: true })
  virtualAccountNumber?: string;

  @Column({ name: 'webhook_data', type: 'json', nullable: true })
  webhookData?: Record<string, any>;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'failed_reason', type: 'text', nullable: true })
  failedReason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserSubscription, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: UserSubscription;

  @ManyToOne(() => UserApiExtension, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'extension_id' })
  extension?: UserApiExtension;

  get isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  get isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }
}
