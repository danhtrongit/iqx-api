import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-123', description: 'ID người dùng' })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email người dùng' })
  email: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Tên hiển thị',
    required: false,
  })
  displayName?: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Họ tên đầy đủ',
    required: false,
  })
  fullName?: string;

  @ApiProperty({
    example: '+84901234567',
    description: 'Số điện thoại',
    required: false,
  })
  phoneE164?: string;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Thời gian xác thực số điện thoại',
    required: false,
  })
  phoneVerifiedAt?: Date;

  @ApiProperty({ example: 'member', description: 'Vai trò người dùng' })
  role: string;

  @ApiProperty({ example: true, description: 'Trạng thái kích hoạt' })
  isActive: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName?: string;
    fullName?: string;
    phoneE164?: string;
    phoneVerifiedAt?: Date;
    role: string;
    isActive: boolean;
  };
  accessToken: string;
  refreshToken: string;
  message: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto, description: 'Thông tin người dùng' })
  user: UserResponseDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Access token',
  })
  accessToken: string;

  @ApiProperty({ example: 'abc123def456...', description: 'Refresh token' })
  refreshToken: string;

  @ApiProperty({ example: 'Đăng nhập thành công', description: 'Thông báo' })
  message: string;
}

export interface MessageResponse {
  message: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Thao tác thành công', description: 'Thông báo' })
  message: string;
}

export class ProfileResponseDto {
  @ApiProperty({ type: UserResponseDto, description: 'Thông tin profile' })
  user: UserResponseDto;

  @ApiProperty({
    example: 'Lấy thông tin profile thành công',
    description: 'Thông báo',
  })
  message: string;
}
