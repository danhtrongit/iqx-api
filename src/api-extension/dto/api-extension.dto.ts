import { IsUUID, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateExtensionPaymentDto {
  @IsUUID()
  extensionPackageId: string;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class PurchaseApiExtensionDto {
  @IsUUID()
  extensionPackageId: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;
}

export class ApiExtensionPackageResponseDto {
  id: string;
  name: string;
  description?: string;
  additionalCalls: number;
  price: number;
  currency: string;
  isActive: boolean;
  pricePerCall: number; // Calculated field
}

export class UserApiExtensionResponseDto {
  id: string;
  extensionPackageName: string;
  additionalCalls: number;
  price: number;
  currency: string;
  purchasedAt: Date;
  subscriptionId: string;
}

