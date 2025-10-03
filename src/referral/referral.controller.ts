import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReferralService } from './referral.service';
import { CommissionService } from './commission.service';
import { ApplyReferralCodeDto, UpdateReferralCodeDto } from './dto/referral.dto';
import { CommissionStatus } from '../entities/commission.entity';

@ApiTags('Referral')
@Controller('referral')
export class ReferralController {
  constructor(
    private readonly referralService: ReferralService,
    private readonly commissionService: CommissionService,
  ) {}

  @Post('generate-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo mã giới thiệu cho user' })
  async generateReferralCode(@Request() req) {
    const referralCode = await this.referralService.createReferralCode(
      req.user.userId,
    );
    return {
      success: true,
      data: referralCode,
    };
  }

  @Get('my-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy mã giới thiệu của tôi' })
  async getMyReferralCode(@Request() req) {
    const referralCode = await this.referralService.getReferralCode(
      req.user.userId,
    );
    return {
      success: true,
      data: referralCode,
    };
  }

  @Put('my-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật mã giới thiệu của tôi' })
  async updateMyReferralCode(
    @Request() req,
    @Body() updateDto: UpdateReferralCodeDto,
  ) {
    const referralCode = await this.referralService.updateReferralCode(
      req.user.userId,
      updateDto.code.toUpperCase(), // Tự động chuyển thành chữ in hoa
    );
    return {
      success: true,
      data: referralCode,
      message: 'Cập nhật mã giới thiệu thành công',
    };
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Áp dụng mã giới thiệu' })
  async applyReferralCode(
    @Request() req,
    @Body() applyReferralCodeDto: ApplyReferralCodeDto,
  ) {
    await this.referralService.applyReferralCode(
      req.user.userId,
      applyReferralCodeDto.code,
    );
    return {
      success: true,
      message: 'Áp dụng mã giới thiệu thành công',
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thống kê referral của tôi' })
  async getMyStats(@Request() req) {
    const stats = await this.referralService.getReferralStats(req.user.userId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('commissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách hoa hồng của tôi' })
  async getMyCommissions(
    @Request() req,
    @Query('status') status?: CommissionStatus,
  ) {
    const commissions = await this.commissionService.getUserCommissions(
      req.user.userId,
      status,
    );
    return {
      success: true,
      data: commissions,
    };
  }

  @Get('commissions/total')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tổng hoa hồng của tôi' })
  async getMyTotalCommission(@Request() req) {
    const total = await this.commissionService.getTotalCommission(
      req.user.userId,
    );
    return {
      success: true,
      data: total,
    };
  }

  @Get('referrals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách người được giới thiệu trực tiếp (F1)' })
  async getMyReferrals(@Request() req) {
    const referrals = await this.referralService.getDirectReferrals(
      req.user.userId,
    );
    return {
      success: true,
      data: referrals.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      })),
    };
  }

  @Get('downline-tree')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy cây downline đầy đủ của user' })
  async getDownlineTree(@Request() req, @Query('maxDepth') maxDepth?: number) {
    const tree = await this.referralService.getDownlineTree(
      req.user.userId,
      maxDepth ? parseInt(maxDepth.toString()) : 10,
    );
    return {
      success: true,
      data: tree,
    };
  }

  @Get('total-downline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tổng số downline trên tất cả các cấp' })
  async getTotalDownline(@Request() req, @Query('maxDepth') maxDepth?: number) {
    const total = await this.referralService.getTotalDownlineCount(
      req.user.userId,
      maxDepth ? parseInt(maxDepth.toString()) : 10,
    );
    return {
      success: true,
      data: { total },
    };
  }
}
