import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  IsObject,
} from 'class-validator';

// Subscription Package DTOs
export class CreateSubscriptionPackageDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  currency: string;

  @IsNumber()
  @Min(1)
  durationDays: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxVirtualPortfolios?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  apiLimit?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSubscriptionPackageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxVirtualPortfolios?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  apiLimit?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// API Extension Package DTOs
export class CreateApiExtensionPackageDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  additionalCalls: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateApiExtensionPackageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  additionalCalls?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

