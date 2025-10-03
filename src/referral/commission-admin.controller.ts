import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CommissionService } from './commission.service';
import { ReferralService } from './referral.service';
import {
  CreateCommissionSettingDto,
  UpdateCommissionSettingDto,
  PayoutExampleDto,
} from './dto/referral.dto';

@ApiTags('Admin - Commission')
@Controller('admin/commission')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class CommissionAdminController {
  constructor(
    private readonly commissionService: CommissionService,
    private readonly referralService: ReferralService,
  ) {}

  @Post('settings')
  @ApiOperation({ summary: 'Tạo commission setting mới' })
  async createSetting(@Body() createDto: CreateCommissionSettingDto) {
    const setting = await this.commissionService.createSetting(createDto);
    return {
      success: true,
      data: setting,
    };
  }

  @Put('settings/:id')
  @ApiOperation({ summary: 'Cập nhật commission setting' })
  async updateSetting(
    @Param('id') id: string,
    @Body() updateDto: UpdateCommissionSettingDto,
  ) {
    const setting = await this.commissionService.updateSetting(id, updateDto);
    return {
      success: true,
      data: setting,
    };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Lấy tất cả commission settings' })
  async getAllSettings() {
    const settings = await this.commissionService.getAllSettings();
    return {
      success: true,
      data: settings,
    };
  }

  @Get('settings/active')
  @ApiOperation({ summary: 'Lấy commission setting đang active' })
  async getActiveSetting() {
    const setting = await this.commissionService.getActiveSetting();
    return {
      success: true,
      data: setting,
    };
  }

  @Delete('settings/:id')
  @ApiOperation({ summary: 'Xóa commission setting' })
  async deleteSetting(@Param('id') id: string) {
    await this.commissionService.deleteSetting(id);
    return {
      success: true,
      message: 'Đã xóa cấu hình hoa hồng',
    };
  }

  @Put('settings/:id/toggle-active')
  @ApiOperation({ summary: 'Kích hoạt/vô hiệu hóa commission setting' })
  async toggleActiveSetting(@Param('id') id: string) {
    const setting = await this.commissionService.toggleActiveSetting(id);
    return {
      success: true,
      data: setting,
      message: setting.isActive
        ? 'Đã kích hoạt cấu hình'
        : 'Đã vô hiệu hóa cấu hình',
    };
  }

  @Post('settings/payout-examples')
  @ApiOperation({ summary: 'Tính ví dụ payout theo setting hiện tại' })
  async getPayoutExamples(@Body() payoutDto: PayoutExampleDto) {
    const examples = await this.commissionService.getPayoutExamples(
      payoutDto.price,
    );
    return {
      success: true,
      data: examples,
    };
  }

  @Put('commissions/:id/paid')
  @ApiOperation({ summary: 'Đánh dấu commission đã thanh toán' })
  async markAsPaid(@Param('id') id: string) {
    const commission = await this.commissionService.markAsPaid(id);
    return {
      success: true,
      data: commission,
    };
  }

  @Put('commissions/:id/cancel')
  @ApiOperation({ summary: 'Hủy commission' })
  async cancelCommission(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    const commission = await this.commissionService.cancelCommission(
      id,
      reason,
    );
    return {
      success: true,
      data: commission,
    };
  }

  @Post('referral/generate-for-all')
  @ApiOperation({ summary: 'Tạo mã giới thiệu cho tất cả user chưa có mã (Migration)' })
  async generateReferralForAllUsers() {
    const result = await this.referralService.generateReferralCodeForAllUsers();
    return {
      success: true,
      data: result,
      message: `Đã tạo mã giới thiệu cho ${result.created} user`,
    };
  }
}
