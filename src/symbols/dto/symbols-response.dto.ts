import { ApiProperty } from '@nestjs/swagger';

export class SymbolResponseDto {
  @ApiProperty({ example: 8424928, description: 'ID chứng khoán' })
  id: number;

  @ApiProperty({ example: 'VNM', description: 'Mã chứng khoán' })
  symbol: string;

  @ApiProperty({ example: 'STOCK', description: 'Loại chứng khoán' })
  type: string;

  @ApiProperty({ example: 'HSX', description: 'Sàn giao dịch' })
  board: string;

  @ApiProperty({
    example: 'Vietnam Dairy Products Joint Stock Company',
    description: 'Tên tiếng Anh',
    required: false,
  })
  en_organ_name?: string;

  @ApiProperty({
    example: 'VINAMILK',
    description: 'Tên viết tắt',
    required: false,
  })
  organ_short_name?: string;

  @ApiProperty({
    example: 'Công ty Cổ phần Sữa Việt Nam',
    description: 'Tên tiếng Việt',
    required: false,
  })
  organ_name?: string;

  @ApiProperty({
    example: 'STO',
    description: 'Mã nhóm sản phẩm',
    required: false,
  })
  product_grp_id?: string;

  @ApiProperty({
    example: 61600,
    description: 'Giá hiện tại (VND)',
    required: false,
  })
  currentPrice?: number | null;

  @ApiProperty({
    example: '2025-09-25T07:40:00.000Z',
    description: 'Thời gian cập nhật giá',
    required: false,
  })
  priceUpdatedAt?: string;

  @ApiProperty({
    example: 61800,
    description: 'Giá mở cửa (VND)',
    required: false,
  })
  openPrice?: number | null;

  @ApiProperty({
    example: 62000,
    description: 'Giá cao nhất (VND)',
    required: false,
  })
  highPrice?: number | null;

  @ApiProperty({
    example: 61400,
    description: 'Giá thấp nhất (VND)',
    required: false,
  })
  lowPrice?: number | null;

  @ApiProperty({
    example: 1250000,
    description: 'Khối lượng giao dịch',
    required: false,
  })
  volume?: number | null;

  @ApiProperty({
    example: 2.5,
    description: 'Phần trăm thay đổi so với ngày hôm trước (%)',
    required: false,
  })
  percentageChange?: number | null;

  @ApiProperty({
    example: 61100,
    description: 'Giá đóng cửa ngày hôm trước (VND)',
    required: false,
  })
  previousClosePrice?: number | null;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Trang hiện tại' })
  page: number;

  @ApiProperty({ example: 20, description: 'Số lượng mỗi trang' })
  limit: number;

  @ApiProperty({ example: 100, description: 'Tổng số kết quả' })
  total: number;

  @ApiProperty({ example: 5, description: 'Tổng số trang' })
  totalPages: number;

  @ApiProperty({ example: true, description: 'Có trang trước' })
  hasPreviousPage: boolean;

  @ApiProperty({ example: true, description: 'Có trang sau' })
  hasNextPage: boolean;
}

export class SymbolsResponseDto {
  @ApiProperty({
    type: [SymbolResponseDto],
    description: 'Danh sách chứng khoán',
  })
  data: SymbolResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Thông tin phân trang' })
  meta: PaginationMetaDto;

  @ApiProperty({
    example: 'Lấy danh sách chứng khoán thành công',
    description: 'Thông báo',
  })
  message: string;
}
