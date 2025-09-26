import { IsUUID, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty({
    example: 'uuid-package-123',
    description: 'ID gói đăng ký',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  packageId: string;

  @ApiPropertyOptional({
    example: 'PAY-123456789',
    description: 'Mã tham chiếu thanh toán',
  })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}

export class RenewSubscriptionDto {
  @ApiPropertyOptional({
    example: 'PAY-987654321',
    description: 'Mã tham chiếu thanh toán giá hạn',
  })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    example: 'Không còn nhu cầu sử dụng',
    description: 'Lý do hủy gói',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
