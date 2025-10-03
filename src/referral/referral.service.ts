import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ReferralCode } from '../entities/referral-code.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(ReferralCode)
    private referralCodeRepository: Repository<ReferralCode>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Tạo mã giới thiệu cho user
   */
  async createReferralCode(userId: string): Promise<ReferralCode> {
    // Kiểm tra user tồn tại
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User không tồn tại');
    }
    
    // Kiểm tra user đã có mã giới thiệu chưa
    const existingCode = await this.referralCodeRepository.findOne({
      where: { user: { id: userId }, isActive: true },
    });

    if (existingCode) {
      return existingCode;
    }

    // Tạo mã giới thiệu unique
    let code: string = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = this.generateCode();
      const existing = await this.referralCodeRepository.findOne({
        where: { code },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique || !code) {
      throw new BadRequestException('Không thể tạo mã giới thiệu, vui lòng thử lại');
    }

    const referralCode = this.referralCodeRepository.create({
      user,
      code,
    });

    return await this.referralCodeRepository.save(referralCode);
  }

  /**
   * Lấy mã giới thiệu của user
   */
  async getReferralCode(userId: string): Promise<ReferralCode | null> {
    return await this.referralCodeRepository.findOne({
      where: { user: { id: userId }, isActive: true },
    });
  }

  /**
   * Cập nhật mã giới thiệu
   * Cho phép sửa mã bất kỳ lúc nào vì logic referral dựa trên userId (ID-based), không phải mã
   */
  async updateReferralCode(userId: string, newCode: string): Promise<ReferralCode> {
    const existingCode = await this.getReferralCode(userId);
    if (!existingCode) {
      throw new NotFoundException('Bạn chưa có mã giới thiệu');
    }

    // Validate mã mới (chỉ cho phép chữ và số, 6-20 ký tự)
    if (!/^[A-Z0-9]{6,20}$/.test(newCode)) {
      throw new BadRequestException(
        'Mã giới thiệu phải từ 6-20 ký tự, chỉ bao gồm chữ cái in hoa và số'
      );
    }

    // Kiểm tra mã mới đã tồn tại chưa
    const codeExists = await this.referralCodeRepository.findOne({
      where: { code: newCode },
    });

    if (codeExists && codeExists.userId !== userId) {
      throw new BadRequestException('Mã giới thiệu đã được sử dụng bởi người khác');
    }

    existingCode.code = newCode;
    return await this.referralCodeRepository.save(existingCode);
  }

  /**
   * Lấy thông tin mã giới thiệu bằng code
   */
  async getReferralByCode(code: string): Promise<ReferralCode | null> {
    return await this.referralCodeRepository.findOne({
      where: { code, isActive: true },
      relations: ['user'],
    });
  }

  /**
   * Apply mã giới thiệu cho user mới
   */
  async applyReferralCode(userId: string, code: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    // Kiểm tra user đã được giới thiệu chưa
    if (user.referredById) {
      throw new BadRequestException('User đã được giới thiệu bởi người khác');
    }

    // Tìm mã giới thiệu
    const referralCode = await this.getReferralByCode(code);
    if (!referralCode) {
      throw new NotFoundException('Mã giới thiệu không tồn tại hoặc đã hết hạn');
    }

    // Không thể tự giới thiệu chính mình
    if (referralCode.userId === userId) {
      throw new BadRequestException('Không thể sử dụng mã giới thiệu của chính mình');
    }

    // Cập nhật referredById cho user
    user.referredById = referralCode.userId;
    await this.userRepository.save(user);

    // Tăng số lượng referrals
    referralCode.totalReferrals += 1;
    await this.referralCodeRepository.save(referralCode);
  }

  /**
   * Lấy chuỗi upline (F0, F1, F2, F3...) của user
   * @param userId User ID cần tìm upline
   * @param maxLevel Số cấp tối đa (mặc định 3)
   * @returns Mảng user IDs từ F0 -> F1 -> F2 -> F3...
   */
  async getUplineChain(userId: string, maxLevel: number = 3): Promise<string[]> {
    const upline: string[] = [];
    let currentUserId: string | undefined = userId;

    for (let i = 0; i < maxLevel; i++) {
      const user = await this.userRepository.findOne({
        where: { id: currentUserId },
      });

      if (!user || !user.referredById) {
        break;
      }

      upline.push(user.referredById);
      currentUserId = user.referredById;
    }

    return upline;
  }

  /**
   * Lấy danh sách downline (F1) của user
   */
  async getDirectReferrals(userId: string): Promise<User[]> {
    const referrals = await this.userRepository.find({
      where: { referredById: userId },
    });
    
    // Loại bỏ chính user đang query (không thể giới thiệu chính mình)
    return referrals.filter(user => user.id !== userId);
  }

  /**
   * Lấy toàn bộ downline tree của user
   */
  async getDownlineTree(userId: string, maxDepth: number = 10): Promise<any> {
    const buildTree = async (currentUserId: string, currentDepth: number = 0): Promise<any> => {
      if (currentDepth >= maxDepth) {
        return null;
      }

      // Lấy user info
      const user = await this.userRepository.findOne({
        where: { id: currentUserId },
      });

      if (!user) {
        return null;
      }

      // Lấy referral code để có totalReferrals và totalCommission
      const referralCode = await this.getReferralCode(currentUserId);

      // Lấy direct referrals
      const directReferrals = await this.userRepository.find({
        where: { referredById: currentUserId },
      });

      // Build children recursively
      const children = await Promise.all(
        directReferrals.map(ref => buildTree(ref.id, currentDepth + 1))
      );

      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        referralCode: referralCode?.code,
        totalReferrals: referralCode?.totalReferrals || 0,
        totalCommission: referralCode?.totalCommission || 0,
        level: currentDepth,
        children: children.filter(child => child !== null),
        childrenCount: directReferrals.length,
      };
    };

    return buildTree(userId);
  }

  /**
   * Lấy tổng số downline trên tất cả các cấp
   */
  async getTotalDownlineCount(userId: string, maxDepth: number = 10): Promise<number> {
    const countDownline = async (currentUserId: string, currentDepth: number = 0): Promise<number> => {
      if (currentDepth >= maxDepth) {
        return 0;
      }

      const directReferrals = await this.userRepository.find({
        where: { referredById: currentUserId },
      });

      let total = directReferrals.length;

      // Đệ quy đếm downline của từng F1
      for (const ref of directReferrals) {
        total += await countDownline(ref.id, currentDepth + 1);
      }

      return total;
    };

    return countDownline(userId);
  }

  /**
   * Lấy thống kê referral của user
   */
  async getReferralStats(userId: string) {
    const referralCode = await this.getReferralCode(userId);
    const directReferrals = await this.getDirectReferrals(userId);

    return {
      referralCode: referralCode?.code,
      totalReferrals: referralCode?.totalReferrals || 0,
      totalCommission: referralCode?.totalCommission || 0,
      directReferrals: directReferrals.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      })),
    };
  }

  /**
   * Generate mã giới thiệu ngẫu nhiên
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    const randomBytes = crypto.randomBytes(8);

    for (let i = 0; i < 8; i++) {
      code += chars[randomBytes[i] % chars.length];
    }

    return code;
  }

  /**
   * Tạo mã giới thiệu cho tất cả user chưa có mã (Admin migration)
   */
  async generateReferralCodeForAllUsers(): Promise<{
    total: number;
    created: number;
    skipped: number;
  }> {
    // Lấy tất cả users
    const allUsers = await this.userRepository.find();
    let created = 0;
    let skipped = 0;

    for (const user of allUsers) {
      try {
        // Kiểm tra xem user đã có mã chưa
        const existingCode = await this.getReferralCode(user.id);

        if (existingCode) {
          skipped++;
          continue;
        }

        // Tạo mã mới cho user
        await this.createReferralCode(user.id);
        created++;
      } catch (error) {
        console.error(`Error creating referral code for user ${user.id}:`, error);
        skipped++;
      }
    }

    return {
      total: allUsers.length,
      created,
      skipped,
    };
  }
}
