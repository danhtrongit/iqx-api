import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  RelationId,
} from 'typeorm';
import { User } from './user.entity';

@Entity('referral_codes')
@Index(['code'], { unique: true })
export class ReferralCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ name: 'total_referrals', type: 'int', default: 0 })
  totalReferrals: number;

  @Column({ name: 'total_commission', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCommission: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @RelationId((referralCode: ReferralCode) => referralCode.user)
  userId: string;
}
