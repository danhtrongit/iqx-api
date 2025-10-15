import { ApiProperty } from '@nestjs/swagger';

export class PriceActionItemDto {
  @ApiProperty({ description: 'Mã chứng khoán', example: 'VNM' })
  ticker: string;

  @ApiProperty({ description: 'Ngày price action', example: '06/10/2025' })
  date: string;

  @ApiProperty({
    description: 'Giá hiện tại',
    example: 75000,
    nullable: true,
  })
  currentPrice: number | null;

  @ApiProperty({
    description: '% thay đổi 1 ngày',
    example: 2.5,
    nullable: true,
  })
  change1D: number | null;

  @ApiProperty({
    description: '% thay đổi 7 ngày',
    example: 5.3,
    nullable: true,
  })
  change7D: number | null;

  @ApiProperty({
    description: '% thay đổi 30 ngày',
    example: 12.8,
    nullable: true,
  })
  change30D: number | null;

  @ApiProperty({
    description: 'Khối lượng giao dịch hiện tại',
    example: 1234567,
    nullable: true,
  })
  volume: number | null;

  @ApiProperty({
    description: 'Khối lượng trung bình 3 tháng',
    example: 987654,
    nullable: true,
  })
  avgVolume3M: number | null;

  @ApiProperty({
    description: 'Giá cao nhất trong 3 tháng',
    example: 80000,
    nullable: true,
  })
  high3M: number | null;

  @ApiProperty({
    description: '% giá hiện tại so với giá cao nhất 3 tháng',
    example: -6.25,
    nullable: true,
  })
  percentFromHigh3M: number | null;
}

export class PriceActionResponseDto {
  @ApiProperty({
    description: 'Danh sách price action',
    type: [PriceActionItemDto],
  })
  data: PriceActionItemDto[];

  @ApiProperty({
    description: 'Thời gian cache được cập nhật',
    example: '2025-10-15T10:00:00.000Z',
  })
  cachedAt: string;

  @ApiProperty({
    description: 'Thông báo',
    example: 'Lấy dữ liệu price action thành công',
  })
  message: string;
}

