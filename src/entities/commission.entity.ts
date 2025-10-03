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
import { Payment } from './payment.entity';

export enum CommissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('commissions')
@Index(['userId', 'status'])
@Index(['paymentId'])
@Index(['referrerId'])
export class Commission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // User nhận hoa hồng
  @Column({ type: 'varchar', length: '36', name: 'user_id' })
  userId: string;

  // Payment gốc (người mua subscription)
  @Column({ type: 'varchar', length: '36', name: 'payment_id' })
  paymentId: string;

  // User thực hiện mua hàng (F1, F2, F3...)
  @Column({ type: 'varchar', length: '36', name: 'referrer_id' })
  referrerId: string;

  // Cấp độ hoa hồng (1 = F1, 2 = F2, 3 = F3...)
  @Column({ type: 'int' })
  tier: number;

  // Số tiền hoa hồng
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  // % hoa hồng áp dụng
  @Column({ name: 'commission_pct', type: 'decimal', precision: 5, scale: 4 })
  commissionPct: number;

  // Giá gốc của payment
  @Column({ name: 'original_amount', type: 'decimal', precision: 15, scale: 2 })
  originalAmount: number;

  @Column({
    type: 'enum',
    enum: CommissionStatus,
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Payment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'referrer_id' })
  referrer: User;
}
