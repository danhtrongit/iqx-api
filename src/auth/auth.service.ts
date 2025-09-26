import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { PhoneVerificationCode } from '../entities/phone-verification-code.entity';
import { AuditLog } from '../entities/audit-log.entity';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyPhoneDto,
  ConfirmPhoneDto,
} from './dto/auth.dto';
import { AuthResponse, MessageResponse } from './dto/response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(PhoneVerificationCode)
    private phoneVerificationCodeRepository: Repository<PhoneVerificationCode>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(
    registerDto: RegisterDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    const { email, password, displayName, fullName, phoneE164 } = registerDto;

    // Kiểm tra email đã tồn tại
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Kiểm tra số điện thoại đã tồn tại (nếu có)
    if (phoneE164) {
      const existingPhone = await this.userRepository.findOne({
        where: { phoneE164 },
      });
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    // Hash mật khẩu
    const passwordHash = await argon2.hash(password);

    // Tạo user mới
    const user = this.userRepository.create({
      email,
      passwordHash,
      displayName,
      fullName,
      phoneE164,
    });

    const savedUser = await this.userRepository.save(user);

    // Tạo tokens
    const { accessToken, refreshToken } = await this.generateTokens(savedUser);

    // Lưu refresh token vào session
    await this.createSession(savedUser.id, refreshToken, userAgent, ipAddress);

    // Ghi audit log
    await this.createAuditLog(
      'auth.register',
      savedUser.id,
      ipAddress,
      userAgent,
      { email },
    );

    return {
      user: this.sanitizeUser(savedUser),
      accessToken,
      refreshToken,
      message: 'Đăng ký thành công',
    };
  }

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Tìm user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Tạo tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Lưu refresh token vào session
    await this.createSession(user.id, refreshToken, userAgent, ipAddress);

    // Ghi audit log
    await this.createAuditLog('auth.login', user.id, ipAddress, userAgent, {
      email,
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
      message: 'Đăng nhập thành công',
    };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    const { refreshToken } = refreshTokenDto;

    // Hash refresh token để tìm trong database
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Tìm session
    const session = await this.sessionRepository.findOne({
      where: { tokenHash, revokedAt: IsNull() },
      relations: ['user'],
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    if (!session.user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    // Tạo tokens mới
    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(session.user);

    // Cập nhật session
    const newTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');
    session.tokenHash = newTokenHash;
    session.lastUsedAt = new Date();
    await this.sessionRepository.save(session);

    // Ghi audit log
    await this.createAuditLog(
      'auth.refresh',
      session.user.id,
      ipAddress,
      userAgent,
    );

    return {
      user: this.sanitizeUser(session.user),
      accessToken,
      refreshToken: newRefreshToken,
      message: 'Làm mới token thành công',
    };
  }

  async logout(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<MessageResponse> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Tìm và revoke session
    const session = await this.sessionRepository.findOne({
      where: { userId, tokenHash, revokedAt: IsNull() },
    });

    if (session) {
      session.revokedAt = new Date();
      await this.sessionRepository.save(session);
    }

    // Ghi audit log
    await this.createAuditLog('auth.logout', userId, ipAddress, userAgent);

    return { message: 'Đăng xuất thành công' };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<MessageResponse> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || !user.isActive) {
      // Không tiết lộ thông tin user có tồn tại hay không
      return {
        message: 'Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn reset mật khẩu',
      };
    }

    // Tạo reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

    await this.passwordResetTokenRepository.save({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Ghi audit log
    await this.createAuditLog(
      'auth.forgot_password',
      user.id,
      ipAddress,
      userAgent,
      { email },
    );

    // TODO: Gửi email reset password với resetToken
    console.log(`Reset token for ${email}: ${resetToken}`);

    return {
      message: 'Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn reset mật khẩu',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<MessageResponse> {
    const { token, newPassword } = resetPasswordDto;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { tokenHash, consumedAt: IsNull() },
      relations: ['user'],
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new BadRequestException(
        'Token reset mật khẩu không hợp lệ hoặc đã hết hạn',
      );
    }

    // Hash mật khẩu mới
    const passwordHash = await argon2.hash(newPassword);

    // Cập nhật mật khẩu
    resetToken.user.passwordHash = passwordHash;
    await this.userRepository.save(resetToken.user);

    // Đánh dấu token đã sử dụng
    resetToken.consumedAt = new Date();
    await this.passwordResetTokenRepository.save(resetToken);

    // Revoke tất cả sessions của user
    await this.sessionRepository.update(
      { userId: resetToken.user.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    // Ghi audit log
    await this.createAuditLog(
      'auth.reset_password',
      resetToken.user.id,
      ipAddress,
      userAgent,
    );

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async sendPhoneVerification(
    userId: string,
    verifyPhoneDto: VerifyPhoneDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<MessageResponse> {
    const { phoneE164 } = verifyPhoneDto;

    // Kiểm tra số điện thoại đã được sử dụng
    const existingPhone = await this.userRepository.findOne({
      where: { phoneE164 },
    });

    if (existingPhone && existingPhone.id !== userId) {
      throw new ConflictException('Số điện thoại đã được sử dụng');
    }

    // Tạo mã OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await this.phoneVerificationCodeRepository.save({
      userId,
      phoneE164,
      codeHash,
      expiresAt,
    });

    // Ghi audit log
    await this.createAuditLog(
      'phone.verify_request',
      userId,
      ipAddress,
      userAgent,
      { phoneE164 },
    );

    // TODO: Gửi SMS với code
    console.log(`SMS code for ${phoneE164}: ${code}`);

    return { message: 'Mã xác thực đã được gửi qua SMS' };
  }

  async confirmPhoneVerification(
    userId: string,
    confirmPhoneDto: ConfirmPhoneDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<MessageResponse> {
    const { phoneE164, code } = confirmPhoneDto;

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    const verificationCode = await this.phoneVerificationCodeRepository.findOne(
      {
        where: { userId, phoneE164, codeHash, consumedAt: IsNull() },
      },
    );

    if (!verificationCode || verificationCode.expiresAt < new Date()) {
      throw new BadRequestException('Mã xác thực không đúng hoặc đã hết hạn');
    }

    // Cập nhật số điện thoại và xác nhận
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    user.phoneE164 = phoneE164;
    user.phoneVerifiedAt = new Date();
    await this.userRepository.save(user);

    // Đánh dấu mã đã sử dụng
    verificationCode.consumedAt = new Date();
    await this.phoneVerificationCodeRepository.save(verificationCode);

    // Ghi audit log
    await this.createAuditLog(
      'phone.verify_success',
      userId,
      ipAddress,
      userAgent,
      { phoneE164 },
    );

    return { message: 'Xác thực số điện thoại thành công' };
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = crypto.randomBytes(32).toString('hex');

    return { accessToken, refreshToken };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày

    await this.sessionRepository.save({
      userId,
      tokenHash,
      userAgent,
      ipAddress,
      lastUsedAt: new Date(),
      expiresAt,
    });
  }

  private async createAuditLog(
    action: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    data?: any,
  ) {
    await this.auditLogRepository.save({
      userId,
      action,
      ipAddress,
      userAgent,
      data,
    });
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
