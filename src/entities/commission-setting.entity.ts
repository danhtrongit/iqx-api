import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('commission_settings')
export class CommissionSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, default: 'default' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Tổng % hoa hồng (ví dụ: 0.15 = 15%)
  @Column({ name: 'commission_total_pct', type: 'decimal', precision: 5, scale: 4, default: 0.15 })
  commissionTotalPct: number;

  // Mảng % cho từng cấp (ví dụ: [0.1, 0.035, 0.015])
  @Column({ name: 'tiers_pct', type: 'json' })
  tiersPct: number[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Helper để tính số tiền hoa hồng cho một cấp
  calculateTierAmount(price: number, tierIndex: number): number {
    if (tierIndex >= this.tiersPct.length) {
      return 0;
    }
    return Math.floor(price * this.tiersPct[tierIndex]);
  }

  // Helper để tính tổng hoa hồng
  calculateTotalCommission(price: number): number {
    return Math.floor(price * this.commissionTotalPct);
  }
}
