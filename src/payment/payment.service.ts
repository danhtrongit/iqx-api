import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { User } from '../entities/user.entity';
import { SubscriptionPackage } from '../entities/subscription-package.entity';
import { UserSubscription, SubscriptionStatus } from '../entities/user-subscription.entity';
import { PayOSService } from './payos.service';
import { CreatePaymentDto, PayOSWebhookDto } from './dto/payment.dto';
import { CommissionService } from '../referral/commission.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(SubscriptionPackage)
    private subscriptionPackageRepository: Repository<SubscriptionPackage>,

    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,

    private payosService: PayOSService,
    private configService: ConfigService,
    private commissionService: CommissionService,
  ) {}

  /**
   * Tạo thanh toán mới cho gói đăng ký
   */
  async createPayment(userId: string, createPaymentDto: CreatePaymentDto) {
    // Kiểm tra user tồn tại
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Kiểm tra gói đăng ký
    const subscriptionPackage =
      await this.subscriptionPackageRepository.findOne({
        where: { id: createPaymentDto.packageId, isActive: true },
      });
    if (!subscriptionPackage) {
      throw new NotFoundException('Subscription package not found');
    }

    // Kiểm tra user đã có gói đang hoạt động chưa
    const activeSubscription = await this.userSubscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (activeSubscription && activeSubscription.isActive) {
      throw new BadRequestException(
        'Bạn đã có gói đăng ký đang hoạt động. Vui lòng hủy gói hiện tại trước khi nâng cấp.',
      );
    }

    // Tạo order code
    const orderCode = this.payosService.generateOrderCode();

    // Log để debug
    this.logger.debug(`Creating payment for user: ${userId}, orderCode: ${orderCode}`);

    // Tạo payment record
    const payment = this.paymentRepository.create({
      userId: userId,
      orderCode: orderCode,
      amount: subscriptionPackage.price,
      currency: subscriptionPackage.currency,
      description: `Thanh toán gói ${subscriptionPackage.name}`,
      status: PaymentStatus.PENDING,
    });

    this.logger.debug(`Payment object created: ${JSON.stringify(payment)}`);

    await this.paymentRepository.save(payment);

    try {
      // PayOS requires description to be max 25 characters
      const shortDescription = `Don ${orderCode}`.substring(0, 25);
      
      const paymentLink = await this.payosService.createPaymentLink({
        orderCode,
        amount: Number(subscriptionPackage.price),
        description: shortDescription,
        returnUrl:
          createPaymentDto.returnUrl ||
          this.configService.get<string>('PAYOS_RETURN_URL'),
        cancelUrl:
          createPaymentDto.cancelUrl ||
          this.configService.get<string>('PAYOS_CANCEL_URL'),
        buyerName: user.displayName || user.fullName,
        buyerEmail: user.email,
        buyerPhone: user.phoneE164,
      });

      // Cập nhật payment với thông tin từ PayOS
      payment.paymentLinkId = paymentLink.data.paymentLinkId;
      payment.checkoutUrl = paymentLink.data.checkoutUrl;
      payment.qrCode = paymentLink.data.qrCode;
      payment.accountNumber = paymentLink.data.accountNumber;
      payment.status = PaymentStatus.PROCESSING;

      await this.paymentRepository.save(payment);

      return {
        id: payment.id,
        orderCode: payment.orderCode,
        amount: payment.amount,
        currency: payment.currency,
        description: payment.description,
        status: payment.status,
        checkoutUrl: payment.checkoutUrl,
        qrCode: payment.qrCode,
        paymentLinkId: payment.paymentLinkId,
        package: {
          id: subscriptionPackage.id,
          name: subscriptionPackage.name,
          description: subscriptionPackage.description,
          durationDays: subscriptionPackage.durationDays,
        },
      };
    } catch (error) {
      // Cập nhật payment status thành failed
      payment.status = PaymentStatus.FAILED;
      payment.failedReason = error.message;
      await this.paymentRepository.save(payment);

      this.logger.error('Error creating payment:', error);
      throw new BadRequestException(
        'Không thể tạo link thanh toán. Vui lòng thử lại.',
      );
    }
  }

  /**
   * Xử lý webhook từ PayOS
   */
  async handleWebhook(webhookData: PayOSWebhookDto) {
    this.logger.log(`Processing webhook for order: ${webhookData.data.orderCode}`);

    // Verify signature
    try {
      await this.payosService.verifyWebhookSignature(webhookData);
    } catch (error) {
      this.logger.warn('Invalid webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    // Tìm payment theo orderCode
    const payment = await this.paymentRepository.findOne({
      where: { orderCode: webhookData.data.orderCode },
      relations: ['user'],
    });

    if (!payment) {
      this.logger.warn(`Payment not found for order: ${webhookData.data.orderCode}`);
      throw new NotFoundException('Payment not found');
    }

    // Kiểm tra payment đã xử lý chưa
    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.log('Payment already processed');
      return { message: 'Payment already processed' };
    }

    // Cập nhật payment với thông tin từ webhook
    payment.reference = webhookData.data.reference;
    payment.transactionDateTime = new Date(
      webhookData.data.transactionDateTime,
    );
    payment.counterAccountBankId = webhookData.data.counterAccountBankId;
    payment.counterAccountBankName = webhookData.data.counterAccountBankName;
    payment.counterAccountName = webhookData.data.counterAccountName;
    payment.counterAccountNumber = webhookData.data.counterAccountNumber;
    payment.virtualAccountName = webhookData.data.virtualAccountName;
    payment.virtualAccountNumber = webhookData.data.virtualAccountNumber;
    payment.webhookData = webhookData;

    // Kiểm tra trạng thái thanh toán
    if (webhookData.success && webhookData.code === '00') {
      payment.status = PaymentStatus.COMPLETED;
      payment.completedAt = new Date();

      await this.paymentRepository.save(payment);

      // Kích hoạt subscription
      await this.activateSubscription(payment);

      // Tính hoa hồng cho upline
      try {
        await this.commissionService.processCommission(payment.id);
        this.logger.log(`Commission processed for payment: ${payment.id}`);
      } catch (error) {
        this.logger.error(`Error processing commission for payment ${payment.id}:`, error);
      }

      this.logger.log(`Payment completed for order: ${webhookData.data.orderCode}`);
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.failedReason = webhookData.desc;
      await this.paymentRepository.save(payment);

      this.logger.warn(`Payment failed for order: ${webhookData.data.orderCode}`);
    }

    return { message: 'Webhook processed successfully' };
  }

  /**
   * Kích hoạt subscription sau khi thanh toán thành công
   */
  private async activateSubscription(payment: Payment) {
    // Tìm gói từ description (hoặc có thể lưu packageId trong payment)
    // Ở đây ta parse từ description hoặc tạo thêm trường packageId trong Payment
    const packages = await this.subscriptionPackageRepository.find({
      where: { isActive: true },
    });

    // Tìm package phù hợp với amount
    const subscriptionPackage = packages.find(
      (pkg) => Number(pkg.price) === Number(payment.amount),
    );

    if (!subscriptionPackage) {
      this.logger.error(
        `Cannot find subscription package for amount: ${payment.amount}`,
      );
      return;
    }

    // Tạo subscription mới
    const startsAt = new Date();
    const expiresAt = new Date(
      startsAt.getTime() +
        subscriptionPackage.durationDays * 24 * 60 * 60 * 1000,
    );

    const userSubscription = this.userSubscriptionRepository.create({
      userId: payment.userId,
      packageId: subscriptionPackage.id,
      status: SubscriptionStatus.ACTIVE,
      startsAt,
      expiresAt,
      price: subscriptionPackage.price,
      currency: subscriptionPackage.currency,
      paymentReference: payment.reference,
    });

    const savedSubscription =
      await this.userSubscriptionRepository.save(userSubscription);

    // Cập nhật payment với subscription id
    payment.subscriptionId = savedSubscription.id;
    await this.paymentRepository.save(payment);

    this.logger.log(
      `Subscription activated for user ${payment.userId}, expires at ${expiresAt}`,
    );
  }

  /**
   * Lấy thông tin payment theo ID
   */
  async getPaymentById(paymentId: string, userId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, userId },
      relations: ['subscription', 'subscription.package'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Lấy danh sách payments của user
   */
  async getUserPayments(userId: string) {
    return this.paymentRepository.find({
      where: { userId },
      relations: ['subscription', 'subscription.package'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Kiểm tra trạng thái thanh toán
   */
  async checkPaymentStatus(orderCode: number, userId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { orderCode, userId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    try {
      // Gọi API PayOS để lấy thông tin mới nhất
      const paymentInfo = await this.payosService.getPaymentLinkInfo(orderCode);

      this.logger.debug(`PayOS payment info for order ${orderCode}: status=${paymentInfo.status}, current payment status=${payment.status}`);

      // Cập nhật payment status dựa trên thông tin từ PayOS
      if (paymentInfo.status === 'PAID' && payment.status !== PaymentStatus.COMPLETED) {
        this.logger.log(`Updating payment ${orderCode} to COMPLETED based on PayOS status`);
        
        payment.status = PaymentStatus.COMPLETED;
        payment.completedAt = new Date();
        
        // Lấy thông tin transaction từ PayOS
        if (paymentInfo.transactions && paymentInfo.transactions.length > 0) {
          const transaction = paymentInfo.transactions[0];
          payment.reference = transaction.reference;
          payment.transactionDateTime = new Date(transaction.transactionDateTime);
          payment.counterAccountBankId = transaction.counterAccountBankId;
          payment.counterAccountBankName = transaction.counterAccountBankName;
          payment.counterAccountName = transaction.counterAccountName;
          payment.counterAccountNumber = transaction.counterAccountNumber;
          payment.virtualAccountName = transaction.virtualAccountName;
          payment.virtualAccountNumber = transaction.virtualAccountNumber;
        }

        await this.paymentRepository.save(payment);

        // Kích hoạt subscription nếu chưa có
        if (!payment.subscriptionId) {
          await this.activateSubscription(payment);
        }

        // Tính hoa hồng cho upline
        try {
          await this.commissionService.processCommission(payment.id);
          this.logger.log(`Commission processed for payment: ${payment.id}`);
        } catch (error) {
          this.logger.error(`Error processing commission for payment ${payment.id}:`, error);
        }
      } else if (paymentInfo.status === 'CANCELLED' && payment.status !== PaymentStatus.CANCELLED) {
        this.logger.log(`Updating payment ${orderCode} to CANCELLED based on PayOS status`);
        payment.status = PaymentStatus.CANCELLED;
        payment.cancelledAt = new Date();
        payment.failedReason = paymentInfo.cancellationReason || 'Payment cancelled';
        await this.paymentRepository.save(payment);
      } else if (paymentInfo.status === 'EXPIRED' && payment.status !== PaymentStatus.FAILED) {
        this.logger.log(`Updating payment ${orderCode} to FAILED based on PayOS status`);
        payment.status = PaymentStatus.FAILED;
        payment.failedReason = 'Payment link expired';
        await this.paymentRepository.save(payment);
      }

      // Trả về payment đã được cập nhật
      return {
        ...payment,
        payosStatus: paymentInfo.status,
        payosInfo: paymentInfo,
      };
    } catch (error) {
      this.logger.error('Error checking payment status:', error);
      return payment;
    }
  }

  /**
   * Hủy payment
   */
  async cancelPayment(paymentId: string, userId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed payment');
    }

    try {
      // Hủy payment link trên PayOS
      await this.payosService.cancelPaymentLink(
        payment.orderCode,
        'User cancelled',
      );

      payment.status = PaymentStatus.CANCELLED;
      payment.cancelledAt = new Date();
      await this.paymentRepository.save(payment);

      return payment;
    } catch (error) {
      this.logger.error('Error cancelling payment:', error);
      throw new BadRequestException('Cannot cancel payment on PayOS');
    }
  }
}
