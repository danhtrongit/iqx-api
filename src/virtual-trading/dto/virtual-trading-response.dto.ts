import { ApiProperty } from '@nestjs/swagger';

export class PortfolioResponseDto {
  @ApiProperty({ example: 'uuid-123', description: 'Portfolio ID' })
  id: string;

  @ApiProperty({ example: 10000000000, description: 'Số dư tiền mặt' })
  cashBalance: number;

  @ApiProperty({ example: 10000000000, description: 'Tổng giá trị tài sản' })
  totalAssetValue: number;

  @ApiProperty({
    example: 'Tạo portfolio thành công',
    description: 'Thông báo',
  })
  message: string;
}

export class HoldingDto {
  @ApiProperty({ example: 'VNM', description: 'Mã chứng khoán' })
  symbolCode: string;

  @ApiProperty({ example: 'Vinamilk', description: 'Tên chứng khoán' })
  symbolName: string;

  @ApiProperty({ example: 100, description: 'Số lượng sở hữu' })
  quantity: number;

  @ApiProperty({ example: 65000, description: 'Giá mua trung bình' })
  averagePrice: number;

  @ApiProperty({ example: 67000, description: 'Giá hiện tại' })
  currentPrice: number;

  @ApiProperty({ example: 66000, description: 'Giá hôm qua', nullable: true })
  yesterdayPrice: number | null;

  @ApiProperty({ example: 200000, description: 'Lãi/lỗ chưa thực hiện' })
  unrealizedProfitLoss: number;

  @ApiProperty({ example: 3.08, description: 'Tỷ lệ % lãi/lỗ' })
  profitLossPercentage: number;
}

export class PortfolioDetailDto {
  @ApiProperty({ example: 'uuid-123', description: 'Portfolio ID' })
  id: string;

  @ApiProperty({ example: 'uuid-456', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 9000000000, description: 'Số dư tiền mặt' })
  cashBalance: number;

  @ApiProperty({ example: 11000000000, description: 'Tổng giá trị tài sản' })
  totalAssetValue: number;

  @ApiProperty({ example: 2000000000, description: 'Giá trị cổ phiếu' })
  stockValue: number;

  @ApiProperty({ example: 1000000000, description: 'Tổng lãi/lỗ' })
  totalProfitLoss: number;

  @ApiProperty({
    example: 500000000,
    description: 'Lợi nhuận dự kiến (chưa thực hiện - từ holdings hiện tại)',
  })
  unrealizedProfitLoss: number;

  @ApiProperty({
    example: 300000000,
    description: 'Lợi nhuận đã thực hiện (từ các giao dịch bán)',
  })
  realizedProfitLoss: number;

  @ApiProperty({ example: 10.0, description: 'Tỷ lệ % lãi/lỗ tổng' })
  profitLossPercentage: number;

  @ApiProperty({ type: [HoldingDto], description: 'Danh sách holdings' })
  holdings: HoldingDto[];
}

export class PortfolioDetailResponseDto {
  @ApiProperty({ type: PortfolioDetailDto, description: 'Thông tin portfolio' })
  data: PortfolioDetailDto;

  @ApiProperty({
    example: 'Lấy thông tin portfolio thành công',
    description: 'Thông báo',
  })
  message: string;
}

export class TransactionResponseDto {
  @ApiProperty({ example: 'uuid-789', description: 'Transaction ID' })
  transactionId: string;

  @ApiProperty({ example: 'VNM', description: 'Mã chứng khoán' })
  symbolCode: string;

  @ApiProperty({ example: 100, description: 'Số lượng' })
  quantity: number;

  @ApiProperty({ example: 65000, description: 'Giá mỗi cổ phiếu' })
  pricePerShare: number;

  @ApiProperty({ example: 6500000, description: 'Tổng số tiền' })
  totalAmount: number;

  @ApiProperty({ example: 13000, description: 'Phí giao dịch' })
  fee: number;

  @ApiProperty({ example: 6513000, description: 'Số tiền thực tế' })
  netAmount: number;

  @ApiProperty({
    example: 'Mua 100 cổ phiếu VNM thành công',
    description: 'Thông báo',
  })
  message: string;
}

export class SellTransactionResponseDto {
  @ApiProperty({ example: 'uuid-789', description: 'Transaction ID' })
  transactionId: string;

  @ApiProperty({ example: 'VNM', description: 'Mã chứng khoán' })
  symbolCode: string;

  @ApiProperty({ example: 50, description: 'Số lượng' })
  quantity: number;

  @ApiProperty({ example: 67000, description: 'Giá mỗi cổ phiếu' })
  pricePerShare: number;

  @ApiProperty({ example: 3350000, description: 'Tổng số tiền' })
  totalAmount: number;

  @ApiProperty({ example: 6700, description: 'Phí giao dịch' })
  fee: number;

  @ApiProperty({ example: 3350, description: 'Thuế' })
  tax: number;

  @ApiProperty({ example: 3339950, description: 'Số tiền thực tế nhận được' })
  netAmount: number;

  @ApiProperty({
    example: 'Bán 50 cổ phiếu VNM thành công',
    description: 'Thông báo',
  })
  message: string;
}

export class TransactionDto {
  @ApiProperty({ example: 'uuid-123', description: 'Transaction ID' })
  id: string;

  @ApiProperty({ example: 'VNM', description: 'Mã chứng khoán' })
  symbolCode: string;

  @ApiProperty({
    example: 'Vinamilk',
    description: 'Tên chứng khoán',
    required: false,
  })
  symbolName?: string;

  @ApiProperty({
    example: 'BUY',
    enum: ['BUY', 'SELL'],
    description: 'Loại giao dịch',
  })
  transactionType: 'BUY' | 'SELL';

  @ApiProperty({ example: 100, description: 'Số lượng' })
  quantity: number;

  @ApiProperty({ example: 65000, description: 'Giá mỗi cổ phiếu' })
  pricePerShare: number;

  @ApiProperty({ example: 6500000, description: 'Tổng số tiền' })
  totalAmount: number;

  @ApiProperty({ example: 13000, description: 'Phí giao dịch' })
  fee: number;

  @ApiProperty({ example: 0, description: 'Thuế (chỉ áp dụng khi bán)' })
  tax: number;

  @ApiProperty({ example: 6513000, description: 'Số tiền thực tế' })
  netAmount: number;

  @ApiProperty({ example: 'EXECUTED', description: 'Trạng thái giao dịch' })
  status: string;

  @ApiProperty({
    example: '2023-12-01T10:00:00Z',
    description: 'Thời gian tạo lệnh',
  })
  createdAt: string;

  @ApiProperty({
    example: '2023-12-01T10:00:01Z',
    description: 'Thời gian thực hiện',
  })
  executedAt: string;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Trang hiện tại' })
  page: number;

  @ApiProperty({ example: 20, description: 'Số bản ghi mỗi trang' })
  limit: number;

  @ApiProperty({ example: 150, description: 'Tổng số bản ghi' })
  total: number;

  @ApiProperty({ example: 8, description: 'Tổng số trang' })
  totalPages: number;
}

export class TransactionHistoryResponseDto {
  @ApiProperty({ type: [TransactionDto], description: 'Danh sách giao dịch' })
  data: TransactionDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Thông tin phân trang' })
  meta: PaginationMetaDto;

  @ApiProperty({
    example: 'Lấy lịch sử giao dịch thành công',
    description: 'Thông báo',
  })
  message: string;
}

export class StockPriceResponseDto {
  @ApiProperty({ example: 'VNM', description: 'Mã chứng khoán' })
  symbol: string;

  @ApiProperty({ example: 67000, description: 'Giá hiện tại', nullable: true })
  currentPrice: number | null;

  @ApiProperty({
    example: '2023-12-01T10:00:00Z',
    description: 'Thời gian cập nhật',
  })
  timestamp: string;

  @ApiProperty({ example: 'Lấy giá thành công', description: 'Thông báo' })
  message: string;
}

export class LeaderboardItemDto {
  @ApiProperty({ example: 1, description: 'Hạng' })
  rank: number;

  @ApiProperty({ example: 'trader123', description: 'Tên người dùng' })
  username: string;

  @ApiProperty({ example: 12500000000, description: 'Tổng giá trị tài sản' })
  totalAssetValue: number;

  @ApiProperty({ example: 2500000000, description: 'Tổng lãi/lỗ' })
  profitLoss: number;

  @ApiProperty({
    example: 1500000000,
    description: 'Lợi nhuận dự kiến (chưa thực hiện)',
  })
  unrealizedProfitLoss: number;

  @ApiProperty({
    example: 1000000000,
    description: 'Lợi nhuận đã thực hiện',
  })
  realizedProfitLoss: number;

  @ApiProperty({ example: 25.0, description: 'Tỷ lệ % lãi/lỗ' })
  profitLossPercentage: number;

  @ApiProperty({ example: 45, description: 'Tổng số giao dịch' })
  totalTransactions: number;

  @ApiProperty({ example: 32, description: 'Số giao dịch thành công' })
  successfulTrades: number;

  @ApiProperty({
    example: '2023-12-01T00:00:00Z',
    description: 'Thời gian tạo portfolio',
  })
  createdAt: string;
}

export class LeaderboardMetaDto {
  @ApiProperty({ example: 50, description: 'Giới hạn số bản ghi' })
  limit: number;

  @ApiProperty({
    example: 'percentage',
    enum: ['value', 'percentage'],
    description: 'Tiêu chí sắp xếp',
  })
  sortBy: 'value' | 'percentage';

  @ApiProperty({ example: 50, description: 'Tổng số bản ghi trả về' })
  total: number;
}

export class LeaderboardResponseDto {
  @ApiProperty({
    type: [LeaderboardItemDto],
    description: 'Danh sách bảng xếp hạng',
  })
  data: LeaderboardItemDto[];

  @ApiProperty({
    type: LeaderboardMetaDto,
    description: 'Metadata bảng xếp hạng',
  })
  meta: LeaderboardMetaDto;

  @ApiProperty({
    example: 'Lấy bảng xếp hạng thành công',
    description: 'Thông báo',
  })
  message: string;
}
