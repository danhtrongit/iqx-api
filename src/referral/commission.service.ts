import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission, CommissionStatus } from '../entities/commission.entity';
import { CommissionSetting } from '../entities/commission-setting.entity';
import { Payment } from '../entities/payment.entity';
import { ReferralService } from '../referral/referral.service';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(Commission)
    private commissionRepository: Repository<Commission>,
    @InjectRepository(CommissionSetting)
    private commissionSettingRepository: Repository<CommissionSetting>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private referralService: ReferralService,
  ) {}

  /**
   * Tính và lưu hoa hồng khi có payment thành công
   */
  async processCommission(paymentId: string): Promise<Commission[]> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment không tồn tại');
    }

    // Lấy commission setting đang active
    const setting = await this.getActiveSetting();
    if (!setting) {
      console.log('Không có commission setting active, bỏ qua tính hoa hồng');
      return [];
    }

    // Lấy upline chain của user mua hàng
    const upline = await this.referralService.getUplineChain(
      payment.userId,
      setting.tiersPct.length,
    );

    if (upline.length === 0) {
      console.log('User không có upline, không tính hoa hồng');
      return [];
    }

    const commissions: Commission[] = [];

    // Tạo commission cho từng tier
    for (let i = 0; i < upline.length && i < setting.tiersPct.length; i++) {
      const tier = i + 1;
      const userId = upline[i];
      const commissionPct = setting.tiersPct[i];
      const amount = setting.calculateTierAmount(Number(payment.amount), i);

      const commission = this.commissionRepository.create({
        userId,
        paymentId: payment.id,
        referrerId: payment.userId,
        tier,
        amount,
        commissionPct,
        originalAmount: payment.amount,
        status: CommissionStatus.APPROVED,
      });

      const savedCommission = await this.commissionRepository.save(commission);
      commissions.push(savedCommission);

      // Cập nhật tổng hoa hồng trong ReferralCode
      await this.updateReferralCodeCommission(userId, amount);
    }

    return commissions;
  }

  /**
   * Lấy commission setting đang active
   */
  async getActiveSetting(): Promise<CommissionSetting | null> {
    return await this.commissionSettingRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy danh sách commission của user
   */
  async getUserCommissions(
    userId: string,
    status?: CommissionStatus,
  ): Promise<Commission[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return await this.commissionRepository.find({
      where,
      relations: ['payment', 'referrer'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy tổng hoa hồng của user
   */
  async getTotalCommission(userId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    paid: number;
  }> {
    const commissions = await this.getUserCommissions(userId);

    return {
      total: commissions.reduce((sum, c) => sum + Number(c.amount), 0),
      pending: commissions
        .filter((c) => c.status === CommissionStatus.PENDING)
        .reduce((sum, c) => sum + Number(c.amount), 0),
      approved: commissions
        .filter((c) => c.status === CommissionStatus.APPROVED)
        .reduce((sum, c) => sum + Number(c.amount), 0),
      paid: commissions
        .filter((c) => c.status === CommissionStatus.PAID)
        .reduce((sum, c) => sum + Number(c.amount), 0),
    };
  }

  /**
   * Đánh dấu commission đã thanh toán
   */
  async markAsPaid(commissionId: string): Promise<Commission> {
    const commission = await this.commissionRepository.findOne({
      where: { id: commissionId },
    });

    if (!commission) {
      throw new NotFoundException('Commission không tồn tại');
    }

    commission.status = CommissionStatus.PAID;
    commission.paidAt = new Date();

    return await this.commissionRepository.save(commission);
  }

  /**
   * Hủy commission
   */
  async cancelCommission(
    commissionId: string,
    reason: string,
  ): Promise<Commission> {
    const commission = await this.commissionRepository.findOne({
      where: { id: commissionId },
    });

    if (!commission) {
      throw new NotFoundException('Commission không tồn tại');
    }

    commission.status = CommissionStatus.CANCELLED;
    commission.cancelledAt = new Date();
    commission.cancellationReason = reason;

    return await this.commissionRepository.save(commission);
  }

  /**
   * Tạo commission setting mới (Admin)
   */
  async createSetting(data: {
    name: string;
    description?: string;
    commissionTotalPct: number;
    tiersPct: number[];
  }): Promise<CommissionSetting> {
    const setting = this.commissionSettingRepository.create(data);
    return await this.commissionSettingRepository.save(setting);
  }

  /**
   * Cập nhật commission setting (Admin)
   */
  async updateSetting(
    id: string,
    data: Partial<CommissionSetting>,
  ): Promise<CommissionSetting> {
    const setting = await this.commissionSettingRepository.findOne({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException('Commission setting không tồn tại');
    }

    Object.assign(setting, data);
    return await this.commissionSettingRepository.save(setting);
  }

  /**
   * Lấy tất cả commission settings (Admin)
   */
  async getAllSettings(): Promise<CommissionSetting[]> {
    return await this.commissionSettingRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Xóa commission setting (Admin)
   */
  async deleteSetting(id: string): Promise<void> {
    const setting = await this.commissionSettingRepository.findOne({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException('Commission setting không tồn tại');
    }

    await this.commissionSettingRepository.remove(setting);
  }

  /**
   * Kích hoạt/vô hiệu hóa commission setting (Admin)
   */
  async toggleActiveSetting(id: string): Promise<CommissionSetting> {
    const setting = await this.commissionSettingRepository.findOne({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException('Commission setting không tồn tại');
    }

    // Nếu đang inactive → active, thì disable tất cả settings khác
    if (!setting.isActive) {
      await this.commissionSettingRepository.update(
        { isActive: true },
        { isActive: false },
      );
    }

    // Toggle trạng thái của setting này
    setting.isActive = !setting.isActive;
    return await this.commissionSettingRepository.save(setting);
  }

  /**
   * Tạo ví dụ payout như trong yêu cầu
   */
  async getPayoutExamples(price: number): Promise<any> {
    const setting = await this.getActiveSetting();
    if (!setting) {
      return null;
    }

    const examples: any = {
      price,
      commission_total_pct: setting.commissionTotalPct,
      tiers_pct: setting.tiersPct,
      payout_examples: {},
    };

    // Tạo ví dụ cho F1, F2, F3, F4
    for (let level = 1; level <= 4; level++) {
      const payouts: Array<{ tier: number; to: string; amount: number }> = [];

      for (let tier = 0; tier < Math.min(level, setting.tiersPct.length); tier++) {
        const amount = setting.calculateTierAmount(price, tier);
        const toLabel = tier === level - 1 ? `F${level}` : `F${level - tier - 1}`;

        payouts.push({
          tier: tier + 1,
          to: toLabel,
          amount,
        });
      }

      examples.payout_examples[`F${level}_sells`] = payouts;
    }

    return examples;
  }

  /**
   * Cập nhật tổng hoa hồng trong ReferralCode
   */
  private async updateReferralCodeCommission(
    userId: string,
    amount: number,
  ): Promise<void> {
    const referralCode = await this.referralService.getReferralCode(userId);
    if (referralCode) {
      referralCode.totalCommission = Number(referralCode.totalCommission) + amount;
      await this.referralService['referralCodeRepository'].save(referralCode);
    }
  }
}
