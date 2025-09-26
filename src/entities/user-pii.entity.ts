import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_pii')
export class UserPii {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ name: 'cccd_cipher', type: 'longblob' })
  cccdCipher: Buffer;

  @Column({ name: 'cccd_hash', type: 'longblob', unique: true, nullable: true })
  cccdHash?: Buffer;

  @Column({ name: 'address_line1', nullable: true })
  addressLine1?: string;

  @Column({ name: 'address_line2', nullable: true })
  addressLine2?: string;

  @Column({ nullable: true })
  ward?: string;

  @Column({ nullable: true })
  district?: string;

  @Column({ nullable: true })
  province?: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode?: string;

  @Column({ name: 'country_code', type: 'char', length: 2, default: 'VN' })
  countryCode: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.userPii, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
