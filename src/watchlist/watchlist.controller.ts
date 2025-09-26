import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddToWatchlistDto, UpdateWatchlistDto } from './dto/watchlist.dto';

@ApiTags('Watchlist')
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách cổ phiếu yêu thích của user' })
  @ApiResponse({ status: 200, description: 'Danh sách cổ phiếu yêu thích' })
  @ApiBearerAuth('JWT-auth')
  async getMyWatchlist(@Request() req) {
    const watchlist = await this.watchlistService.getUserWatchlist(
      req.user.id,
    );
    return {
      data: watchlist,
      count: watchlist.length,
      message: 'Lấy danh sách yêu thích thành công',
    };
  }

  @Get('count')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đếm số lượng cổ phiếu trong danh sách yêu thích' })
  @ApiResponse({ status: 200, description: 'Số lượng cổ phiếu yêu thích' })
  @ApiBearerAuth('JWT-auth')
  async getWatchlistCount(@Request() req) {
    const count = await this.watchlistService.getUserWatchlistCount(
      req.user.id,
    );
    return {
      count,
      message: 'Lấy số lượng yêu thích thành công',
    };
  }

  @Get('alerts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách cổ phiếu có cảnh báo giá' })
  @ApiResponse({ status: 200, description: 'Danh sách cổ phiếu có cảnh báo' })
  @ApiBearerAuth('JWT-auth')
  async getWatchlistWithAlerts(@Request() req) {
    const watchlist = await this.watchlistService.getUserWatchlistWithAlerts(
      req.user.id,
    );
    return {
      data: watchlist,
      count: watchlist.length,
      message: 'Lấy danh sách cảnh báo thành công',
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'Lấy danh sách cổ phiếu được theo dõi nhiều nhất' })
  @ApiResponse({ status: 200, description: 'Danh sách cổ phiếu phổ biến' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularSymbols(@Query('limit') limit?: number) {
    const popular = await this.watchlistService.getPopularWatchlistSymbols(
      limit || 10,
    );
    return {
      data: popular,
      message: 'Lấy danh sách phổ biến thành công',
    };
  }

  @Get('check/:symbolCode')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Kiểm tra cổ phiếu có trong danh sách yêu thích không',
  })
  @ApiResponse({
    status: 200,
    description: 'Trạng thái cổ phiếu trong danh sách yêu thích',
  })
  @ApiParam({ name: 'symbolCode', description: 'Mã cổ phiếu' })
  @ApiBearerAuth('JWT-auth')
  async checkInWatchlist(
    @Request() req,
    @Param('symbolCode') symbolCode: string,
  ) {
    const isInWatchlist = await this.watchlistService.isInWatchlist(
      req.user.id,
      symbolCode,
    );
    const watchlistItem = isInWatchlist
      ? await this.watchlistService.getWatchlistItem(
          req.user.id,
          symbolCode,
        )
      : null;

    return {
      isInWatchlist,
      watchlistItem,
      message: `Cổ phiếu ${symbolCode.toUpperCase()} ${isInWatchlist ? 'có' : 'không có'} trong danh sách yêu thích`,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thêm cổ phiếu vào danh sách yêu thích' })
  @ApiBody({ type: AddToWatchlistDto })
  @ApiResponse({ status: 201, description: 'Thêm thành công' })
  @ApiResponse({ status: 404, description: 'Mã cổ phiếu không tồn tại' })
  @ApiResponse({
    status: 409,
    description: 'Cổ phiếu đã có trong danh sách yêu thích',
  })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  async addToWatchlist(
    @Request() req,
    @Body() addToWatchlistDto: AddToWatchlistDto,
  ) {
    const watchlistItem = await this.watchlistService.addToWatchlist(
      req.user.id,
      addToWatchlistDto.symbolCode,
      addToWatchlistDto.customName,
      addToWatchlistDto.notes,
    );

    return {
      data: watchlistItem,
      message: `Đã thêm ${addToWatchlistDto.symbolCode.toUpperCase()} vào danh sách yêu thích`,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Cập nhật thông tin cổ phiếu trong danh sách yêu thích',
  })
  @ApiBody({ type: UpdateWatchlistDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Mục yêu thích không tồn tại' })
  @ApiParam({ name: 'id', description: 'ID của mục yêu thích' })
  @ApiBearerAuth('JWT-auth')
  async updateWatchlistItem(
    @Request() req,
    @Param('id') id: string,
    @Body() updateWatchlistDto: UpdateWatchlistDto,
  ) {
    const updatedItem = await this.watchlistService.updateWatchlistItem(
      req.user.id,
      id,
      updateWatchlistDto,
    );

    return {
      data: updatedItem,
      message: 'Cập nhật mục yêu thích thành công',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xóa cổ phiếu khỏi danh sách yêu thích' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Mục yêu thích không tồn tại' })
  @ApiParam({ name: 'id', description: 'ID của mục yêu thích' })
  @ApiBearerAuth('JWT-auth')
  async removeFromWatchlist(@Request() req, @Param('id') id: string) {
    await this.watchlistService.removeFromWatchlist(req.user.id, id);

    return {
      message: 'Xóa khỏi danh sách yêu thích thành công',
    };
  }

  @Delete('symbol/:symbolCode')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Xóa cổ phiếu khỏi danh sách yêu thích theo mã cổ phiếu',
  })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({
    status: 404,
    description: 'Cổ phiếu không có trong danh sách yêu thích',
  })
  @ApiParam({ name: 'symbolCode', description: 'Mã cổ phiếu' })
  @ApiBearerAuth('JWT-auth')
  async removeBySymbolCode(
    @Request() req,
    @Param('symbolCode') symbolCode: string,
  ) {
    await this.watchlistService.removeBySymbolCode(req.user.id, symbolCode);

    return {
      message: `Đã xóa ${symbolCode.toUpperCase()} khỏi danh sách yêu thích`,
    };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xóa toàn bộ danh sách yêu thích' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiBearerAuth('JWT-auth')
  async clearWatchlist(@Request() req) {
    const deletedCount = await this.watchlistService.clearUserWatchlist(
      req.user.id,
    );

    return {
      deletedCount,
      message: `Đã xóa ${deletedCount} mục khỏi danh sách yêu thích`,
    };
  }
}
