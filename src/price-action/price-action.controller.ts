import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PriceActionService } from './price-action.service';
import { PriceActionResponseDto } from './dto/price-action.dto';

@ApiTags('Price Action')
@Controller('price-action')
export class PriceActionController {
  constructor(private readonly priceActionService: PriceActionService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy dữ liệu price action',
    description:
      'Lấy dữ liệu price action từ Google Sheets với cache 1 giờ. Bao gồm thông tin giá, thay đổi 1D/7D/30D, khối lượng và metrics 3 tháng.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy dữ liệu price action thành công',
    type: PriceActionResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Lỗi khi lấy dữ liệu',
  })
  async getPriceAction(): Promise<PriceActionResponseDto> {
    try {
      const result = await this.priceActionService.getPriceActionData();
      return {
        data: result.data,
        cachedAt: result.cachedAt,
        message: 'Lấy dữ liệu price action thành công',
      };
    } catch (error) {
      throw error;
    }
  }
}

