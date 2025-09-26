import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyPhoneDto,
  ConfirmPhoneDto,
  LogoutDto,
} from './dto/auth.dto';
import {
  AuthResponseDto,
  MessageResponseDto,
  ProfileResponseDto,
} from './dto/response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Đăng ký tài khoản',
    description: 'Tạo tài khoản mới với email và mật khẩu',
  })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email hoặc số điện thoại đã được sử dụng',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.register(registerDto, userAgent, ip);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Đăng nhập',
    description: 'Đăng nhập bằng email và mật khẩu',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto, userAgent, ip);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Làm mới token',
    description: 'Tạo access token mới từ refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Làm mới token thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto, userAgent, ip);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Đăng xuất',
    description: 'Đăng xuất và vô hiệu hóa refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất thành công',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @Request() req,
    @Body() body: LogoutDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<MessageResponseDto> {
    return this.authService.logout(
      req.user.id,
      body.refreshToken,
      ip,
      userAgent,
    );
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Yêu cầu reset mật khẩu',
    description: 'Gửi email chứa link reset mật khẩu',
  })
  @ApiResponse({
    status: 200,
    description: 'Email reset mật khẩu đã được gửi',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto, ip, userAgent);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Đặt lại mật khẩu',
    description: 'Đặt lại mật khẩu bằng token reset',
  })
  @ApiResponse({
    status: 200,
    description: 'Đặt lại mật khẩu thành công',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Token reset mật khẩu không hợp lệ hoặc đã hết hạn',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<MessageResponseDto> {
    return this.authService.resetPassword(resetPasswordDto, ip, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Post('phone/verify')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Gửi mã xác thực SMS',
    description: 'Gửi mã OTP 6 chữ số qua SMS để xác thực số điện thoại',
  })
  @ApiResponse({
    status: 200,
    description: 'Mã xác thực đã được gửi qua SMS',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Số điện thoại đã được sử dụng' })
  async sendPhoneVerification(
    @Request() req,
    @Body() verifyPhoneDto: VerifyPhoneDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<MessageResponseDto> {
    return this.authService.sendPhoneVerification(
      req.user.id,
      verifyPhoneDto,
      ip,
      userAgent,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('phone/confirm')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Xác thực số điện thoại',
    description: 'Xác thực số điện thoại bằng mã OTP',
  })
  @ApiResponse({
    status: 200,
    description: 'Xác thực số điện thoại thành công',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 400,
    description: 'Mã xác thực không đúng hoặc đã hết hạn',
  })
  async confirmPhoneVerification(
    @Request() req,
    @Body() confirmPhoneDto: ConfirmPhoneDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<MessageResponseDto> {
    return this.authService.confirmPhoneVerification(
      req.user.id,
      confirmPhoneDto,
      ip,
      userAgent,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy thông tin profile',
    description: 'Lấy thông tin chi tiết của người dùng hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin profile thành công',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req): Promise<ProfileResponseDto> {
    return {
      user: req.user,
      message: 'Lấy thông tin profile thành công',
    };
  }
}
