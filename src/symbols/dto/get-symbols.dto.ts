import {
  IsOptional,
  IsString,
  IsIn,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class GetSymbolsDto {
  @ApiProperty({
    example: 'VNM',
    description: 'Tìm kiếm theo mã chứng khoán',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Mã chứng khoán phải là chuỗi ký tự' })
  symbol?: string;

  @ApiProperty({
    example: 'STOCK',
    description: 'Loại chứng khoán',
    enum: ['STOCK', 'BOND', 'FU'],
    required: false,
  })
  @IsOptional()
  @IsIn(['STOCK', 'BOND', 'FU'], { message: 'Loại chứng khoán không hợp lệ' })
  type?: string;

  @ApiProperty({
    example: 'HSX',
    description: 'Sàn giao dịch',
    enum: ['HSX', 'HNX', 'UPCOM'],
    required: false,
  })
  @IsOptional()
  @IsIn(['HSX', 'HNX', 'UPCOM'], { message: 'Sàn giao dịch không hợp lệ' })
  board?: string;

  @ApiProperty({
    example: 'vinamilk',
    description: 'Tìm kiếm theo tên công ty',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tên công ty phải là chuỗi ký tự' })
  search?: string;

  @ApiProperty({
    example: 1,
    description: 'Trang hiện tại',
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang phải lớn hơn 0' })
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Số lượng kết quả mỗi trang',
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là số nguyên' })
  @Min(1, { message: 'Limit phải lớn hơn 0' })
  @Max(100, { message: 'Limit không được vượt quá 100' })
  limit?: number = 20;

  @ApiProperty({
    example: true,
    description: 'Có bao gồm giá hiện tại từ VietCap API không (chậm hơn)',
    type: 'boolean',
    required: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  includePrices?: boolean;
}
