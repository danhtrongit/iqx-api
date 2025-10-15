import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { UserSubscription } from './user-subscription.entity';
import { ApiExtensionPackage } from './api-extension-package.entity';

@Entity('user_api_extensions')
export class UserApiExtension {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'subscription_id' })
  subscriptionId: string;

  @Column('uuid', { name: 'extension_package_id' })
  extensionPackageId: string;

  @Column({ name: 'additional_calls', type: 'int' })
  additionalCalls: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency: string;

  @Column({ name: 'payment_reference', nullable: true })
  paymentReference?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserSubscription)
  @JoinColumn({ name: 'subscription_id' })
  subscription: UserSubscription;

  @ManyToOne(() => ApiExtensionPackage)
  @JoinColumn({ name: 'extension_package_id' })
  extensionPackage: ApiExtensionPackage;
}


