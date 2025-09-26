import { Controller, Get, Query, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SymbolsService } from './symbols.service';
import { GetSymbolsDto } from './dto/get-symbols.dto';
import {
  SymbolsResponseDto,
  SymbolResponseDto,
} from './dto/symbols-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageResponseDto } from '../auth/dto/response.dto';

@ApiTags('Symbols')
@Controller('symbols')
export class SymbolsController {
  constructor(private readonly symbolsService: SymbolsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách chứng khoán',
    description: 'Lấy danh sách chứng khoán với phân trang và bộ lọc',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách chứng khoán thành công',
    type: SymbolsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Tham số đầu vào không hợp lệ',
  })
  async getSymbols(
    @Query() queryDto: GetSymbolsDto,
  ): Promise<SymbolsResponseDto> {
    return this.symbolsService.getSymbols(queryDto);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Lấy tất cả chứng khoán',
    description:
      'Lấy tất cả chứng khoán không phân trang (cẩn thận với dữ liệu lớn)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy tất cả chứng khoán thành công',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/SymbolResponseDto' },
        },
        count: { type: 'number', example: 1500 },
        message: {
          type: 'string',
          example: 'Lấy tất cả chứng khoán thành công',
        },
      },
    },
  })
  async getAllSymbols(
    @Query() queryDto: Omit<GetSymbolsDto, 'page' | 'limit'>,
  ) {
    return this.symbolsService.getAllSymbols(queryDto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Tìm kiếm chứng khoán',
    description: 'Tìm kiếm chứng khoán theo mã, tên công ty',
  })
  @ApiResponse({
    status: 200,
    description: 'Tìm kiếm thành công',
    type: SymbolsResponseDto,
  })
  async searchSymbols(
    @Query() queryDto: GetSymbolsDto,
  ): Promise<SymbolsResponseDto> {
    return this.symbolsService.getSymbols(queryDto);
  }

  @Get('count')
  @ApiOperation({
    summary: 'Đếm số lượng chứng khoán',
    description: 'Lấy tổng số lượng chứng khoán trong hệ thống',
  })
  @ApiResponse({
    status: 200,
    description: 'Đếm thành công',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 1500 },
        message: {
          type: 'string',
          example: 'Lấy số lượng chứng khoán thành công',
        },
      },
    },
  })
  async getSymbolsCount() {
    const count = await this.symbolsService.getSymbolsCount();
    return {
      count,
      message: 'Lấy số lượng chứng khoán thành công',
    };
  }

  @Get(':symbol')
  @ApiOperation({
    summary: 'Lấy thông tin chứng khoán theo mã',
    description: 'Lấy thông tin chi tiết của một chứng khoán theo mã',
  })
  @ApiParam({
    name: 'symbol',
    description: 'Mã chứng khoán',
    example: 'VNM',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    schema: {
      type: 'object',
      properties: {
        data: { $ref: '#/components/schemas/SymbolResponseDto' },
        message: {
          type: 'string',
          example: 'Lấy thông tin chứng khoán thành công',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy chứng khoán',
  })
  async getSymbolByCode(
    @Param('symbol') symbol: string,
    @Query('includePrices') includePrices?: string | boolean,
  ) {
    const data = await this.symbolsService.getSymbolByCode(symbol);

    if (!data) {
      return {
        data: null,
        message: 'Không tìm thấy chứng khoán',
      };
    }

    const symbolResponse: any = {
      id: data.id,
      symbol: data.symbol,
      type: data.type,
      board: data.board,
      enOrganName: data.enOrganName,
      organShortName: data.organShortName,
      organName: data.organName,
      productGrpID: data.productGrpID,
    };

    // Add price if requested
    const shouldIncludePrices =
      includePrices === true ||
      includePrices === 'true' ||
      includePrices === '1' ||
      Number(includePrices) === 1;

    if (shouldIncludePrices) {
      const priceData = await this.symbolsService.getCurrentPrice(data.symbol);
      symbolResponse.currentPrice = priceData.price;
      symbolResponse.priceUpdatedAt = priceData.timestamp.toISOString();
    }

    return {
      data: symbolResponse,
      message: 'Lấy thông tin chứng khoán thành công',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Đồng bộ dữ liệu chứng khoán',
    description:
      'Đồng bộ dữ liệu chứng khoán từ VietCap API (chỉ dành cho admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Đồng bộ thành công',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập',
  })
  @ApiResponse({
    status: 500,
    description: 'Lỗi khi đồng bộ dữ liệu',
  })
  async syncSymbols(): Promise<MessageResponseDto> {
    try {
      await this.symbolsService.syncSymbols();
      return {
        message: 'Đồng bộ dữ liệu chứng khoán thành công',
      };
    } catch (error) {
      throw error;
    }
  }
}
