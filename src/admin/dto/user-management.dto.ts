import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatus } from '../../entities/user-subscription.entity';

export class ListUsersQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['admin', 'member', 'premium'])
  role?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['email', 'createdAt', 'updatedAt'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class UpdateUserRoleDto {
  @IsEnum(['admin', 'member', 'premium'])
  role: string;
}

export class AssignSubscriptionDto {
  @IsUUID()
  packageId: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean = false;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class UserStatsDto {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  premiumUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
}

