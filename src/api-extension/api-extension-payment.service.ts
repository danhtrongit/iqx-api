import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus, PaymentType } from '../entities/payment.entity';
import { User } from '../entities/user.entity';
import { ApiExtensionPackage } from '../entities/api-extension-package.entity';
import { UserApiExtension } from '../entities/user-api-extension.entity';
import { UserSubscription, SubscriptionStatus } from '../entities/user-subscription.entity';
import { PayOSService } from '../payment/payos.service';
import { CreateExtensionPaymentDto } from './dto/api-extension.dto';

@Injectable()
export class ApiExtensionPaymentService {
  private readonly logger = new Logger(ApiExtensionPaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(ApiExtensionPackage)
    private apiExtensionPackageRepository: Repository<ApiExtensionPackage>,

    @InjectRepository(UserApiExtension)
    private userApiExtensionRepository: Repository<UserApiExtension>,

    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,

    private payosService: PayOSService,
    private configService: ConfigService,
  ) {}

  /**
   * Create payment for API extension package
   */
  async createExtensionPayment(
    userId: string,
    dto: CreateExtensionPaymentDto,
  ) {
    // Check user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check active subscription
    const activeSubscription = await this.userSubscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: { expiresAt: 'DESC' },
    });

    if (!activeSubscription) {
      throw new BadRequestException(
        'Bạn cần có gói subscription đang hoạt động để mua gói mở rộng',
      );
    }

    if (activeSubscription.isExpired) {
      throw new BadRequestException(
        'Gói subscription của bạn đã hết hạn. Vui lòng gia hạn trước khi mua gói mở rộng',
      );
    }

    // Check extension package
    const extensionPackage = await this.apiExtensionPackageRepository.findOne({
      where: { id: dto.extensionPackageId, isActive: true },
    });

    if (!extensionPackage) {
      throw new NotFoundException('Gói mở rộng không tồn tại');
    }

    // Create order code
    const orderCode = this.payosService.generateOrderCode();

    // Create payment record
    const payment = this.paymentRepository.create({
      userId: userId,
      orderCode: orderCode,
      amount: extensionPackage.price,
      currency: extensionPackage.currency,
      description: `Thanh toán ${extensionPackage.name}`,
      status: PaymentStatus.PENDING,
      paymentType: PaymentType.EXTENSION,
      packageId: extensionPackage.id,
    });

    await this.paymentRepository.save(payment);

    try {
      // PayOS requires description to be max 25 characters
      const shortDescription = `Ext ${orderCode}`.substring(0, 25);

      const paymentLink = await this.payosService.createPaymentLink({
        orderCode,
        amount: Number(extensionPackage.price),
        description: shortDescription,
        returnUrl:
          dto.returnUrl ||
          this.configService.get<string>('PAYOS_RETURN_URL'),
        cancelUrl:
          dto.cancelUrl ||
          this.configService.get<string>('PAYOS_CANCEL_URL'),
        buyerName: user.displayName || user.fullName,
        buyerEmail: user.email,
        buyerPhone: user.phoneE164,
      });

      // Update payment with info from PayOS
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
          id: extensionPackage.id,
          name: extensionPackage.name,
          description: extensionPackage.description,
          additionalCalls: extensionPackage.additionalCalls,
        },
      };
    } catch (error) {
      // Update payment status to failed
      payment.status = PaymentStatus.FAILED;
      payment.failedReason = error.message;
      await this.paymentRepository.save(payment);

      this.logger.error('Error creating extension payment:', error);
      throw new BadRequestException(
        'Không thể tạo link thanh toán. Vui lòng thử lại.',
      );
    }
  }

  /**
   * Check extension payment status
   */
  async checkExtensionPaymentStatus(userId: string, orderCode: number) {
    const payment = await this.paymentRepository.findOne({
      where: { orderCode, userId, paymentType: PaymentType.EXTENSION },
      relations: ['extension', 'extension.extensionPackage'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    try {
      // Get latest info from PayOS
      const paymentInfo = await this.payosService.getPaymentLinkInfo(orderCode);

      this.logger.debug(
        `PayOS payment info for order ${orderCode}: status=${paymentInfo.status}`,
      );

      // Update payment status based on PayOS info
      if (
        paymentInfo.status === 'PAID' &&
        payment.status !== PaymentStatus.COMPLETED
      ) {
        this.logger.log(
          `Updating extension payment ${orderCode} to COMPLETED`,
        );

        payment.status = PaymentStatus.COMPLETED;
        payment.completedAt = new Date();

        // Get transaction info from PayOS
        if (paymentInfo.transactions && paymentInfo.transactions.length > 0) {
          const transaction = paymentInfo.transactions[0];
          payment.reference = transaction.reference;
          payment.transactionDateTime = new Date(
            transaction.transactionDateTime,
          );
          payment.counterAccountBankId = transaction.counterAccountBankId;
          payment.counterAccountBankName = transaction.counterAccountBankName;
          payment.counterAccountName = transaction.counterAccountName;
          payment.counterAccountNumber = transaction.counterAccountNumber;
          payment.virtualAccountName = transaction.virtualAccountName;
          payment.virtualAccountNumber = transaction.virtualAccountNumber;
        }

        await this.paymentRepository.save(payment);

        // Activate extension if not yet activated
        if (!payment.extensionId) {
          await this.activateExtension(payment);
        }
      } else if (
        paymentInfo.status === 'CANCELLED' &&
        payment.status !== PaymentStatus.CANCELLED
      ) {
        this.logger.log(`Updating payment ${orderCode} to CANCELLED`);
        payment.status = PaymentStatus.CANCELLED;
        payment.cancelledAt = new Date();
        payment.failedReason =
          paymentInfo.cancellationReason || 'Payment cancelled';
        await this.paymentRepository.save(payment);
      } else if (
        paymentInfo.status === 'EXPIRED' &&
        payment.status !== PaymentStatus.FAILED
      ) {
        this.logger.log(`Updating payment ${orderCode} to FAILED`);
        payment.status = PaymentStatus.FAILED;
        payment.failedReason = 'Payment link expired';
        await this.paymentRepository.save(payment);
      }

      return {
        ...payment,
        payosStatus: paymentInfo.status,
        payosInfo: paymentInfo,
      };
    } catch (error) {
      this.logger.error('Error checking extension payment status:', error);
      return payment;
    }
  }

  /**
   * Activate extension after successful payment
   */
  async activateExtension(payment: Payment): Promise<void> {
    // Get active subscription
    const activeSubscription = await this.userSubscriptionRepository.findOne({
      where: {
        userId: payment.userId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: { expiresAt: 'DESC' },
    });

    if (!activeSubscription) {
      this.logger.error(
        `Cannot activate extension: no active subscription for user ${payment.userId}`,
      );
      return;
    }

    // Get extension package
    const extensionPackage = await this.apiExtensionPackageRepository.findOne({
      where: { id: payment.packageId },
    });

    if (!extensionPackage) {
      this.logger.error(
        `Cannot find extension package for id: ${payment.packageId}`,
      );
      return;
    }

    // Create user api extension record
    const userExtension = this.userApiExtensionRepository.create({
      userId: payment.userId,
      subscriptionId: activeSubscription.id,
      extensionPackageId: extensionPackage.id,
      additionalCalls: extensionPackage.additionalCalls,
      price: extensionPackage.price,
      currency: extensionPackage.currency,
      paymentReference: payment.reference,
    });

    const savedExtension =
      await this.userApiExtensionRepository.save(userExtension);

    // Update subscription API limit
    const currentLimit = activeSubscription.apiCallsLimit || 0;
    activeSubscription.apiCallsLimit =
      currentLimit + extensionPackage.additionalCalls;
    await this.userSubscriptionRepository.save(activeSubscription);

    // Update payment with extension id
    payment.extensionId = savedExtension.id;
    await this.paymentRepository.save(payment);

    this.logger.log(
      `Extension activated for user ${payment.userId}: +${extensionPackage.additionalCalls} calls`,
    );
  }
}

