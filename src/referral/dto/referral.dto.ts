import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyReferralCodeDto {
  @ApiProperty({ description: 'Mã giới thiệu' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class UpdateReferralCodeDto {
  @ApiProperty({ description: 'Mã giới thiệu mới (6-20 ký tự, chỉ chữ in hoa và số)' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class CreateCommissionSettingDto {
  @ApiProperty({ description: 'Tên setting' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Mô tả', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Tổng % hoa hồng (0.15 = 15%)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionTotalPct: number;

  @ApiProperty({ description: 'Mảng % cho từng cấp, ví dụ: [0.1, 0.035, 0.015]' })
  @IsArray()
  @IsNumber({}, { each: true })
  tiersPct: number[];

  @ApiProperty({ description: 'Trạng thái active (mặc định: true)', required: false })
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCommissionSettingDto {
  @ApiProperty({ description: 'Tên setting', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Mô tả', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Tổng % hoa hồng (0.15 = 15%)', required: false })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  commissionTotalPct?: number;

  @ApiProperty({ description: 'Mảng % cho từng cấp', required: false })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  tiersPct?: number[];

  @ApiProperty({ description: 'Trạng thái active', required: false })
  @IsOptional()
  isActive?: boolean;
}

export class PayoutExampleDto {
  @ApiProperty({ description: 'Giá gói subscription' })
  @IsNumber()
  @Min(0)
  price: number;
}
