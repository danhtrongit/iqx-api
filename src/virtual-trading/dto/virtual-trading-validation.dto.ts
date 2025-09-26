import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BuyStockDto {
  @ApiProperty({
    description: 'Mã chứng khoán',
    example: 'VNM',
    maxLength: 10,
  })
  @IsString()
  @MaxLength(10)
  symbolCode: string;

  @ApiProperty({
    description: 'Số lượng cổ phiếu',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Loại lệnh',
    enum: ['MARKET', 'LIMIT'],
    example: 'MARKET',
  })
  @IsEnum(['MARKET', 'LIMIT'])
  orderType: 'MARKET' | 'LIMIT';

  @ApiPropertyOptional({
    description: 'Giá giới hạn (bắt buộc nếu orderType = LIMIT)',
    example: 65000,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limitPrice?: number;
}

export class SellStockDto {
  @ApiProperty({
    description: 'Mã chứng khoán',
    example: 'VNM',
    maxLength: 10,
  })
  @IsString()
  @MaxLength(10)
  symbolCode: string;

  @ApiProperty({
    description: 'Số lượng cổ phiếu',
    example: 50,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Loại lệnh',
    enum: ['MARKET', 'LIMIT'],
    example: 'MARKET',
  })
  @IsEnum(['MARKET', 'LIMIT'])
  orderType: 'MARKET' | 'LIMIT';

  @ApiPropertyOptional({
    description: 'Giá giới hạn (bắt buộc nếu orderType = LIMIT)',
    example: 65000,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limitPrice?: number;
}
