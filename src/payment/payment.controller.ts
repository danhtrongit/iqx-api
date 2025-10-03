import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreatePaymentDto,
  PayOSWebhookDto,
  CheckPaymentStatusDto,
} from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Tạo thanh toán mới cho gói Premium',
    description:
      'API này tạo một thanh toán mới cho gói đăng ký Premium. Trả về link thanh toán và mã QR.',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Tạo thanh toán thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Yêu cầu không hợp lệ hoặc đã có gói đăng ký đang hoạt động',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy gói đăng ký',
  })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Request() req,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentService.createPayment(
      req.user.id,
      createPaymentDto,
    );
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook từ PayOS',
    description:
      'API này nhận webhook từ PayOS để cập nhật trạng thái thanh toán và kích hoạt gói đăng ký.',
  })
  @ApiBody({ type: PayOSWebhookDto })
  @ApiResponse({
    status: 200,
    description: 'Webhook xử lý thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Chữ ký không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thanh toán',
  })
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() webhookData: PayOSWebhookDto) {
    return this.paymentService.handleWebhook(webhookData);
  }

  @Get('my-payments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy danh sách thanh toán của người dùng',
    description:
      'API này trả về danh sách tất cả các thanh toán của người dùng hiện tại.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách thanh toán',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  @ApiBearerAuth('JWT-auth')
  async getMyPayments(@Request() req) {
    return this.paymentService.getUserPayments(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy thông tin thanh toán theo ID',
    description: 'API này trả về thông tin chi tiết của một thanh toán.',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin thanh toán',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thanh toán',
  })
  @ApiBearerAuth('JWT-auth')
  async getPaymentById(@Param('id') paymentId: string, @Request() req) {
    return this.paymentService.getPaymentById(paymentId, req.user.id);
  }

  @Get('check-status/:orderCode')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Kiểm tra trạng thái thanh toán',
    description:
      'API này kiểm tra trạng thái thanh toán mới nhất từ PayOS theo mã đơn hàng.',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin trạng thái thanh toán',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thanh toán',
  })
  @ApiBearerAuth('JWT-auth')
  async checkPaymentStatus(
    @Param('orderCode') orderCode: string,
    @Request() req,
  ) {
    return this.paymentService.checkPaymentStatus(
      Number(orderCode),
      req.user.id,
    );
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Hủy thanh toán',
    description:
      'API này hủy một thanh toán đang chờ xử lý. Không thể hủy thanh toán đã hoàn thành.',
  })
  @ApiResponse({
    status: 200,
    description: 'Hủy thanh toán thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể hủy thanh toán đã hoàn thành',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thanh toán',
  })
  @ApiBearerAuth('JWT-auth')
  async cancelPayment(@Param('id') paymentId: string, @Request() req) {
    return this.paymentService.cancelPayment(paymentId, req.user.id);
  }
}
