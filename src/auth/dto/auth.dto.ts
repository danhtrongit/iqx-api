import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Địa chỉ email của người dùng',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mật khẩu (tối thiểu 8 ký tự)',
    minLength: 8,
  })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Tên hiển thị',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tên hiển thị phải là chuỗi ký tự' })
  displayName?: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Họ và tên đầy đủ',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  fullName?: string;

  @ApiProperty({
    example: '+84901234567',
    description: 'Số điện thoại định dạng E.164',
    required: false,
  })
  @IsOptional()
  @Matches(/^\+[1-9][0-9]{7,14}$/, {
    message: 'Số điện thoại không đúng định dạng E.164',
  })
  phoneE164?: string;

  @ApiProperty({
    example: 'ABC12345',
    description: 'Mã giới thiệu',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Mã giới thiệu phải là chuỗi ký tự' })
  referralCode?: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Địa chỉ email',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mật khẩu',
  })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Refresh token',
  })
  @IsString({ message: 'Refresh token phải là chuỗi ký tự' })
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Địa chỉ email để reset mật khẩu',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'reset-token-123',
    description: 'Token reset mật khẩu',
  })
  @IsString({ message: 'Token phải là chuỗi ký tự' })
  token: string;

  @ApiProperty({
    example: 'newpassword123',
    description: 'Mật khẩu mới (tối thiểu 8 ký tự)',
    minLength: 8,
  })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  newPassword: string;
}

export class VerifyPhoneDto {
  @ApiProperty({
    example: '+84901234567',
    description: 'Số điện thoại định dạng E.164',
  })
  @Matches(/^\+[1-9][0-9]{7,14}$/, {
    message: 'Số điện thoại không đúng định dạng E.164',
  })
  phoneE164: string;
}

export class ConfirmPhoneDto {
  @ApiProperty({
    example: '+84901234567',
    description: 'Số điện thoại định dạng E.164',
  })
  @Matches(/^\+[1-9][0-9]{7,14}$/, {
    message: 'Số điện thoại không đúng định dạng E.164',
  })
  phoneE164: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã xác thực 6 chữ số',
    pattern: '^\\d{6}$',
  })
  @IsString({ message: 'Mã xác thực phải là chuỗi ký tự' })
  @Matches(/^\d{6}$/, { message: 'Mã xác thực phải là 6 chữ số' })
  code: string;
}

export class LogoutDto {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Refresh token để logout',
  })
  @IsString({ message: 'Refresh token phải là chuỗi ký tự' })
  refreshToken: string;
}
