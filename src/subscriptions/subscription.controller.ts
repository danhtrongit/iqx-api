import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  SubscribeDto,
  RenewSubscriptionDto,
  CancelSubscriptionDto,
} from './dto/subscription.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('packages')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả gói đăng ký',
    description: 'API này trả về danh sách tất cả các gói đăng ký có sẵn trong hệ thống, bao gồm thông tin chi tiết về giá, tính năng và thời hạn của từng gói.'
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách các gói đăng ký có sẵn được trả về thành công'
  })
  async getPackages() {
    return this.subscriptionService.getAllPackages();
  }

  @Get('packages/:id')
  @ApiOperation({
    summary: 'Lấy thông tin gói đăng ký theo ID',
    description: 'API này trả về thông tin chi tiết của một gói đăng ký cụ thể dựa trên ID được cung cấp.'
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chi tiết gói đăng ký được trả về thành công'
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy gói đăng ký với ID được cung cấp'
  })
  async getPackageById(@Param('id') packageId: string) {
    return this.subscriptionService.getPackageById(packageId);
  }

  @Get('my-plan')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy gói đăng ký hiện tại của người dùng',
    description: 'API này trả về thông tin về gói đăng ký mà người dùng hiện đang sử dụng. Yêu cầu xác thực JWT.'
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chi tiết gói đăng ký hiện tại của người dùng'
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực - Token không hợp lệ hoặc thiếu'
  })
  @ApiBearerAuth('JWT-auth')
  async getMyPlan(@Request() req) {
    return this.subscriptionService.getUserCurrentPlan(req.user.userId);
  }

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy gói đăng ký đang hoạt động',
    description: 'API này trả về thông tin về gói đăng ký đang hoạt động của người dùng hiện tại, bao gồm ngày bắt đầu, ngày hết hạn và trạng thái. Yêu cầu xác thực JWT.'
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin gói đăng ký đang hoạt động'
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực - Token không hợp lệ hoặc thiếu'
  })
  @ApiBearerAuth('JWT-auth')
  async getMySubscription(@Request() req) {
    return this.subscriptionService.getUserActiveSubscription(req.user.userId);
  }

  @Get('my-history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy lịch sử đăng ký',
    description: 'API này trả về toàn bộ lịch sử đăng ký của người dùng, bao gồm các gói đã đăng ký trước đây, đang sử dụng và đã hủy. Yêu cầu xác thực JWT.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lịch sử đăng ký của người dùng'
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực - Token không hợp lệ hoặc thiếu'
  })
  @ApiBearerAuth('JWT-auth')
  async getMyHistory(@Request() req) {
    return this.subscriptionService.getUserSubscriptionHistory(req.user.userId);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Đăng ký gói mới',
    description: 'API này cho phép người dùng đăng ký một gói dịch vụ mới. Người dùng cần cung cấp ID gói muốn đăng ký và có thể cung cấp mã tham chiếu thanh toán. Yêu cầu xác thực JWT.'
  })
  @ApiBody({ type: SubscribeDto })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký gói thành công'
  })
  @ApiResponse({
    status: 400,
    description: 'Yêu cầu không hợp lệ - Người dùng đã có gói đăng ký đang hoạt động'
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực - Token không hợp lệ hoặc thiếu'
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy gói đăng ký với ID được cung cấp'
  })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  async subscribe(@Request() req, @Body() subscribeDto: SubscribeDto) {
    return this.subscriptionService.subscribeUser(
      req.user.userId,
      subscribeDto.packageId,
      subscribeDto.paymentReference,
    );
  }

  @Put(':id/renew')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Gia hạn gói đăng ký',
    description: 'API này cho phép người dùng gia hạn gói đăng ký hiện có. Yêu cầu cung cấp ID của gói đăng ký cần gia hạn và có thể cung cấp mã tham chiếu thanh toán. Yêu cầu xác thực JWT.'
  })
  @ApiBody({ type: RenewSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: 'Gia hạn gói đăng ký thành công'
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể gia hạn gói đăng ký đã bị hủy'
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực - Token không hợp lệ hoặc thiếu'
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy gói đăng ký với ID được cung cấp'
  })
  @ApiBearerAuth('JWT-auth')
  async renewSubscription(
    @Param('id') subscriptionId: string,
    @Body() renewDto: RenewSubscriptionDto,
  ) {
    return this.subscriptionService.renewSubscription(
      subscriptionId,
      renewDto.paymentReference,
    );
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Hủy gói đăng ký',
    description: 'API này cho phép người dùng hủy gói đăng ký đang hoạt động. Người dùng có thể cung cấp lý do hủy gói (tùy chọn). Chỉ có thể hủy các gói đăng ký đang hoạt động. Yêu cầu xác thực JWT.'
  })
  @ApiBody({ type: CancelSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: 'Hủy gói đăng ký thành công'
  })
  @ApiResponse({
    status: 400,
    description: 'Chỉ có thể hủy các gói đăng ký đang hoạt động'
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực - Token không hợp lệ hoặc thiếu'
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy gói đăng ký với ID được cung cấp'
  })
  @ApiBearerAuth('JWT-auth')
  async cancelSubscription(
    @Param('id') subscriptionId: string,
    @Body() cancelDto: CancelSubscriptionDto,
  ) {
    return this.subscriptionService.cancelSubscription(
      subscriptionId,
      cancelDto.reason,
    );
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy thống kê đăng ký',
    description: 'API này trả về các thông tin thống kê về đăng ký của người dùng, bao gồm tổng số gói đã đăng ký, số gói đang hoạt động, số gói đã hủy, v.v. Yêu cầu xác thực JWT.'
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê đăng ký của người dùng'
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực - Token không hợp lệ hoặc thiếu'
  })
  @ApiBearerAuth('JWT-auth')
  async getStats(@Request() req) {
    return this.subscriptionService.getSubscriptionStats(req.user.userId);
  }

  @Post('seed-packages')
  @ApiOperation({
    summary: 'Khởi tạo 3 gói đăng ký mẫu',
    description: 'API này tạo 3 gói đăng ký mẫu trong hệ thống bao gồm: Gói Cơ Bản (99,000 VND), Gói Chuyên Nghiệp (299,000 VND), và Gói Doanh Nghiệp (999,000 VND). Nếu gói đã tồn tại thì sẽ bỏ qua.'
  })
  @ApiResponse({
    status: 201,
    description: 'Khởi tạo các gói đăng ký mẫu thành công'
  })
  @HttpCode(HttpStatus.CREATED)
  async seedPackages() {
    return this.subscriptionService.seedSamplePackages();
  }
}
