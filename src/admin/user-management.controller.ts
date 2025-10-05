import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { UserManagementService } from './user-management.service';
import {
  ListUsersQueryDto,
  UpdateUserRoleDto,
  AssignSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/user-management.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get('stats')
  async getStats() {
    return this.userManagementService.getUserStats();
  }

  @Get()
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.userManagementService.listUsers(query);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userManagementService.getUserById(id);
  }

  @Patch(':id/activate')
  async activateUser(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const adminId = req.user.sub;
    const userAgent = req.headers['user-agent'];
    return this.userManagementService.activateUser(id, adminId, ip, userAgent);
  }

  @Patch(':id/deactivate')
  async deactivateUser(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const adminId = req.user.sub;
    const userAgent = req.headers['user-agent'];
    return this.userManagementService.deactivateUser(
      id,
      adminId,
      ip,
      userAgent,
    );
  }

  @Patch(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const adminId = req.user.sub;
    const userAgent = req.headers['user-agent'];
    return this.userManagementService.updateUserRole(
      id,
      updateRoleDto,
      adminId,
      ip,
      userAgent,
    );
  }

  @Get(':id/subscriptions')
  async getUserSubscriptions(@Param('id') id: string) {
    return this.userManagementService.getUserSubscriptions(id);
  }

  @Post(':id/subscriptions')
  async assignSubscription(
    @Param('id') id: string,
    @Body() assignDto: AssignSubscriptionDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const adminId = req.user.sub;
    const userAgent = req.headers['user-agent'];
    return this.userManagementService.assignSubscription(
      id,
      assignDto,
      adminId,
      ip,
      userAgent,
    );
  }

  @Patch(':id/subscriptions/:subscriptionId')
  async updateSubscription(
    @Param('id') id: string,
    @Param('subscriptionId') subscriptionId: string,
    @Body() updateDto: UpdateSubscriptionDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const adminId = req.user.sub;
    const userAgent = req.headers['user-agent'];
    return this.userManagementService.updateSubscription(
      id,
      subscriptionId,
      updateDto,
      adminId,
      ip,
      userAgent,
    );
  }

  @Delete(':id/subscriptions/:subscriptionId')
  async cancelSubscription(
    @Param('id') id: string,
    @Param('subscriptionId') subscriptionId: string,
    @Body('reason') reason: string,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const adminId = req.user.sub;
    const userAgent = req.headers['user-agent'];
    return this.userManagementService.cancelSubscription(
      id,
      subscriptionId,
      reason || 'Bị hủy bởi admin',
      adminId,
      ip,
      userAgent,
    );
  }
}

