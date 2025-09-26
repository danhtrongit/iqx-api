import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToWatchlistDto {
  @ApiProperty({
    example: 'VNM',
    description: 'Mã chứng khoán',
  })
  @IsString()
  symbolCode: string;

  @ApiPropertyOptional({
    example: 'Vinamilk - Cổ phiếu yêu thích',
    description: 'Tên tùy chỉnh',
  })
  @IsOptional()
  @IsString()
  customName?: string;

  @ApiPropertyOptional({
    example: 'Cổ phiếu tiền năng tốt, theo dõi lâu dài',
    description: 'Ghi chú',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWatchlistDto {
  @ApiPropertyOptional({
    example: 'Vinamilk - Cổ phiếu yêu thích',
    description: 'Tên tùy chỉnh',
  })
  @IsOptional()
  @IsString()
  customName?: string;

  @ApiPropertyOptional({
    example: 'Cổ phiếu tiền năng tốt',
    description: 'Ghi chú',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 70000,
    description: 'Cảnh báo khi giá vượt quá',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  alertPriceHigh?: number;

  @ApiPropertyOptional({
    example: 60000,
    description: 'Cảnh báo khi giá thấp hơn',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  alertPriceLow?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Bật/tắt cảnh báo giá',
  })
  @IsOptional()
  @IsBoolean()
  isAlertEnabled?: boolean;
}

export class RemoveBySymbolDto {
  @ApiProperty({
    example: 'VNM',
    description: 'Mã chứng khoán cần xóa',
  })
  @IsString()
  symbolCode: string;
}
