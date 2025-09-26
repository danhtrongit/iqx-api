import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Session } from './session.entity';
import { UserPii } from './user-pii.entity';
import { PasswordResetToken } from './password-reset-token.entity';
import { PhoneVerificationCode } from './phone-verification-code.entity';
import { AuditLog } from './audit-log.entity';
import { VirtualPortfolio } from './virtual-portfolio.entity';
import { UserSubscription } from './user-subscription.entity';
import { Watchlist } from './watchlist.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'display_name', nullable: true })
  displayName?: string;

  @Column({ name: 'full_name', nullable: true })
  fullName?: string;

  @Column({ name: 'phone_e164', nullable: true, unique: true })
  phoneE164?: string;

  @Column({ name: 'phone_verified_at', type: 'timestamp', nullable: true })
  phoneVerifiedAt?: Date;

  @Column({ default: 'member' })
  role: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToOne(() => UserPii, (userPii) => userPii.user)
  userPii: UserPii;

  @OneToMany(() => PasswordResetToken, (token) => token.user)
  passwordResetTokens: PasswordResetToken[];

  @OneToMany(() => PhoneVerificationCode, (code) => code.user)
  phoneVerificationCodes: PhoneVerificationCode[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];

  @OneToMany(() => VirtualPortfolio, (portfolio) => portfolio.user)
  virtualPortfolios: VirtualPortfolio[];

  @OneToMany(() => UserSubscription, (subscription) => subscription.user)
  userSubscriptions: UserSubscription[];

  @OneToMany(() => Watchlist, (watchlist) => watchlist.user)
  watchlists: Watchlist[];
}
