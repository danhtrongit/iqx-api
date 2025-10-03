import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';

export interface PayOSCreatePaymentLinkData {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl?: string;
  cancelUrl?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface PayOSPaymentLinkResponse {
  code: string;
  desc: string;
  data: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
  };
  signature: string;
}

@Injectable()
export class PayOSService {
  private readonly logger = new Logger(PayOSService.name);
  private readonly payOS: PayOS;

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID') || '';
    const apiKey = this.configService.get<string>('PAYOS_API_KEY') || '';
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY') || '';

    this.payOS = new PayOS({
      clientId,
      apiKey,
      checksumKey,
    });
  }

  /**
   * Tạo link thanh toán PayOS
   */
  async createPaymentLink(
    data: PayOSCreatePaymentLinkData,
  ): Promise<PayOSPaymentLinkResponse> {
    try {
      const payload = {
        orderCode: data.orderCode,
        amount: data.amount,
        description: data.description,
        returnUrl: data.returnUrl || this.configService.get<string>('PAYOS_RETURN_URL') || '',
        cancelUrl: data.cancelUrl || this.configService.get<string>('PAYOS_CANCEL_URL') || '',
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone,
        buyerAddress: data.buyerAddress,
        items: data.items || [
          {
            name: data.description,
            quantity: 1,
            price: data.amount,
          },
        ],
      };

      this.logger.log(`Creating PayOS payment link for order: ${data.orderCode}`);

      const response = await this.payOS.paymentRequests.create(payload);

      this.logger.log(
        `PayOS payment link created successfully: ${response.paymentLinkId}`,
      );

      return {
        code: '00',
        desc: 'success',
        data: {
          bin: response.bin || '',
          accountNumber: response.accountNumber || '',
          accountName: response.accountName || '',
          amount: response.amount,
          description: response.description,
          orderCode: response.orderCode,
          currency: response.currency || 'VND',
          paymentLinkId: response.paymentLinkId,
          status: response.status,
          checkoutUrl: response.checkoutUrl,
          qrCode: response.qrCode || '',
        },
        signature: '',
      };
    } catch (error) {
      this.logger.error('Error creating PayOS payment link:', error.message);
      throw error;
    }
  }

  /**
   * Kiểm tra và xác thực chữ ký webhook từ PayOS
   */
  async verifyWebhookSignature(webhookData: any): Promise<any> {
    try {
      return await this.payOS.webhooks.verify(webhookData);
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán
   */
  async getPaymentLinkInfo(orderCode: number): Promise<any> {
    try {
      const response = await this.payOS.paymentRequests.get(orderCode);
      return response;
    } catch (error) {
      this.logger.error(`Error getting payment info for order ${orderCode}:`, error.message);
      throw error;
    }
  }

  /**
   * Hủy link thanh toán
   */
  async cancelPaymentLink(orderCode: number, reason?: string): Promise<any> {
    try {
      const response = await this.payOS.paymentRequests.cancel(orderCode, reason);
      return response;
    } catch (error) {
      this.logger.error(`Error cancelling payment link ${orderCode}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate unique order code
   */
  generateOrderCode(): number {
    return Math.floor(Date.now() / 1000);
  }
}
