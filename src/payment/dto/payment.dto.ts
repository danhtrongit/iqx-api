import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID của gói đăng ký',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsNotEmpty()
  @IsUUID()
  packageId: string;

  @ApiProperty({
    description: 'URL trả về sau khi thanh toán thành công (optional)',
    example: 'https://yourapp.com/payment/success',
    required: false,
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiProperty({
    description: 'URL để hủy thanh toán (optional)',
    example: 'https://yourapp.com/payment/cancel',
    required: false,
  })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class PayOSWebhookDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  desc: string;

  @ApiProperty()
  @IsNotEmpty()
  success: boolean;

  @ApiProperty()
  @IsNotEmpty()
  data: {
    orderCode: number;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentLinkId: string;
    code: string;
    desc: string;
    counterAccountBankId?: string;
    counterAccountBankName?: string;
    counterAccountName?: string;
    counterAccountNumber?: string;
    virtualAccountName?: string;
    virtualAccountNumber?: string;
  };

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  signature: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderCode: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  checkoutUrl?: string;

  @ApiProperty()
  qrCode?: string;

  @ApiProperty()
  paymentLinkId?: string;
}

export class CheckPaymentStatusDto {
  @ApiProperty({
    description: 'Mã đơn hàng',
    example: 123456789,
  })
  @IsNotEmpty()
  @IsNumber()
  orderCode: number;
}
