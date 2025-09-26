import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { VirtualTradingService } from './virtual-trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  BuyStockDto,
  SellStockDto,
} from './dto/virtual-trading-validation.dto';
import { MessageResponseDto } from '../auth/dto/response.dto';
import {
  PortfolioResponseDto,
  PortfolioDetailResponseDto,
  TransactionResponseDto,
  SellTransactionResponseDto,
  TransactionHistoryResponseDto,
  StockPriceResponseDto,
  LeaderboardResponseDto,
} from './dto/virtual-trading-response.dto';

@ApiTags('Virtual Trading')
@Controller('virtual-trading')
export class VirtualTradingController {
  constructor(private readonly virtualTradingService: VirtualTradingService) {}

  @Post('portfolio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo portfolio đấu trường ảo',
    description: 'Tạo portfolio với số vốn ban đầu 10 tỷ VND',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo portfolio thành công',
    type: PortfolioResponseDto,
  })
  async createPortfolio(@Req() req: any) {
    const portfolio = await this.virtualTradingService.createPortfolio(
      req.user.id,
    );
    return {
      id: portfolio.id,
      cashBalance: portfolio.cashBalance,
      totalAssetValue: portfolio.totalAssetValue,
      message: 'Tạo portfolio thành công',
    };
  }

  @Get('portfolio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy thông tin portfolio',
    description: 'Lấy thông tin chi tiết portfolio bao gồm holdings và P&L',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy portfolio thành công',
    type: PortfolioDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio không tồn tại',
  })
  async getPortfolio(@Req() req: any) {
    const portfolio = await this.virtualTradingService.getPortfolio(
      req.user.id,
    );

    if (!portfolio) {
      return {
        data: null,
        message: 'Portfolio chưa được tạo. Vui lòng tạo portfolio trước.',
      };
    }

    return {
      data: portfolio,
      message: 'Lấy thông tin portfolio thành công',
    };
  }

  @Post('buy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mua cổ phiếu',
    description: 'Đặt lệnh mua cổ phiếu với giá thị trường hoặc giá giới hạn',
  })
  @ApiBody({ type: BuyStockDto })
  @ApiResponse({
    status: 201,
    description: 'Mua cổ phiếu thành công',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Lỗi đầu vào hoặc không đủ số dư',
  })
  @ApiResponse({
    status: 404,
    description: 'Symbol không tồn tại',
  })
  async buyStock(@Req() req: any, @Body() buyDto: BuyStockDto) {
    const transaction = await this.virtualTradingService.buyStock(
      req.user.id,
      buyDto,
    );

    return {
      transactionId: transaction.id,
      symbolCode: transaction.symbolCode,
      quantity: transaction.quantity,
      pricePerShare: transaction.pricePerShare,
      totalAmount: transaction.totalAmount,
      fee: transaction.fee,
      netAmount: transaction.netAmount,
      message: `Mua ${transaction.quantity} cổ phiếu ${transaction.symbolCode} thành công`,
    };
  }

  @Post('sell')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Bán cổ phiếu',
    description: 'Đặt lệnh bán cổ phiếu với giá thị trường hoặc giá giới hạn',
  })
  @ApiBody({ type: SellStockDto })
  @ApiResponse({
    status: 201,
    description: 'Bán cổ phiếu thành công',
    type: SellTransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Lỗi đầu vào hoặc không đủ cổ phiếu để bán',
  })
  async sellStock(@Req() req: any, @Body() sellDto: SellStockDto) {
    const transaction = await this.virtualTradingService.sellStock(
      req.user.id,
      sellDto,
    );

    return {
      transactionId: transaction.id,
      symbolCode: transaction.symbolCode,
      quantity: transaction.quantity,
      pricePerShare: transaction.pricePerShare,
      totalAmount: transaction.totalAmount,
      fee: transaction.fee,
      tax: transaction.tax,
      netAmount: transaction.netAmount,
      message: `Bán ${transaction.quantity} cổ phiếu ${transaction.symbolCode} thành công`,
    };
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lịch sử giao dịch',
    description: 'Lấy lịch sử giao dịch mua/bán của user',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Trang (tối thiểu: 1, mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description:
      'Số bản ghi mỗi trang (tối thiểu: 1, tối đa: 100, mặc định: 20)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['BUY', 'SELL'],
    description: 'Loại giao dịch',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy lịch sử giao dịch thành công',
    type: TransactionHistoryResponseDto,
  })
  async getTransactionHistory(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('type') type?: 'BUY' | 'SELL',
  ) {
    // Validate and sanitize input parameters
    const validPage = Math.max(1, Math.floor(Number(page)) || 1);
    const validLimit = Math.max(
      1,
      Math.min(100, Math.floor(Number(limit)) || 20),
    );

    const result = await this.virtualTradingService.getTransactionHistory(
      req.user.id,
      validPage,
      validLimit,
      type,
    );

    return {
      data: result.data.map((transaction) => ({
        id: transaction.id,
        symbolCode: transaction.symbolCode,
        symbolName:
          transaction.symbol?.organShortName || transaction.symbolCode,
        transactionType: transaction.transactionType,
        quantity: transaction.quantity,
        pricePerShare: transaction.pricePerShare,
        totalAmount: transaction.totalAmount,
        fee: transaction.fee,
        tax: transaction.tax || 0,
        netAmount: transaction.netAmount,
        status: transaction.status,
        createdAt: transaction.createdAt,
        executedAt: transaction.executedAt,
      })),
      meta: result.meta,
      message: 'Lấy lịch sử giao dịch thành công',
    };
  }

  @Get('price/:symbol')
  @ApiOperation({
    summary: 'Lấy giá hiện tại của cổ phiếu',
    description: 'Lấy giá hiện tại từ VietCap API',
  })
  @ApiParam({
    name: 'symbol',
    description: 'Mã chứng khoán',
    example: 'VNM',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy giá thành công',
    type: StockPriceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không thể lấy giá hoặc symbol không tồn tại',
  })
  async getStockPrice(@Param('symbol') symbol: string) {
    const result = await this.virtualTradingService.getStockPrice(symbol);

    if (result.currentPrice === null) {
      return {
        symbol: symbol.toUpperCase(),
        currentPrice: null,
        timestamp: result.timestamp.toISOString(),
        message: 'Không thể lấy giá cho mã chứng khoán này',
      };
    }

    return {
      symbol: symbol.toUpperCase(),
      currentPrice: result.currentPrice,
      timestamp: result.timestamp.toISOString(),
      message: 'Lấy giá thành công',
    };
  }

  @Get('leaderboard')
  @ApiOperation({
    summary: 'Bảng xếp hạng',
    description: 'Lấy bảng xếp hạng top traders',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description:
      'Số lượng top traders (tối thiểu: 1, tối đa: 100, mặc định: 50)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['value', 'percentage'],
    description:
      'Sắp xếp theo tổng giá trị (value) hay tỷ lệ % (percentage) - mặc định: percentage',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy bảng xếp hạng thành công',
    type: LeaderboardResponseDto,
  })
  async getLeaderboard(
    @Query('limit') limit: number = 50,
    @Query('sortBy') sortBy: 'value' | 'percentage' = 'percentage',
  ) {
    // Validate and sanitize input parameters
    const validLimit = Math.max(
      1,
      Math.min(100, Math.floor(Number(limit)) || 50),
    );
    const validSortBy = ['value', 'percentage'].includes(sortBy)
      ? sortBy
      : 'percentage';

    const leaderboard = await this.virtualTradingService.getLeaderboard(
      validLimit,
      validSortBy,
    );

    return {
      data: leaderboard,
      meta: {
        limit: validLimit,
        sortBy: validSortBy,
        total: leaderboard.length,
      },
      message: 'Lấy bảng xếp hạng thành công',
    };
  }
}
