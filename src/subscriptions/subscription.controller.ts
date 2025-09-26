import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  SubscribeDto,
  RenewSubscriptionDto,
  CancelSubscriptionDto,
} from './dto/subscription.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('packages')
  @ApiOperation({ summary: 'Get all available subscription packages' })
  @ApiResponse({ status: 200, description: 'List of available packages' })
  async getPackages() {
    return this.subscriptionService.getAllPackages();
  }

  @Get('packages/:id')
  @ApiOperation({ summary: 'Get subscription package by ID' })
  @ApiResponse({ status: 200, description: 'Subscription package details' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async getPackageById(@Param('id') packageId: string) {
    return this.subscriptionService.getPackageById(packageId);
  }

  @Get('my-plan')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user subscription plan' })
  @ApiResponse({
    status: 200,
    description: 'Current subscription plan details',
  })
  @ApiBearerAuth('JWT-auth')
  async getMyPlan(@Request() req) {
    return this.subscriptionService.getUserCurrentPlan(req.user.userId);
  }

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user active subscription' })
  @ApiResponse({ status: 200, description: 'Current active subscription' })
  @ApiBearerAuth('JWT-auth')
  async getMySubscription(@Request() req) {
    return this.subscriptionService.getUserActiveSubscription(req.user.userId);
  }

  @Get('my-history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user subscription history' })
  @ApiResponse({ status: 200, description: 'Subscription history' })
  @ApiBearerAuth('JWT-auth')
  async getMyHistory(@Request() req) {
    return this.subscriptionService.getUserSubscriptionHistory(req.user.userId);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Subscribe to a package' })
  @ApiBody({ type: SubscribeDto })
  @ApiResponse({ status: 201, description: 'Successfully subscribed' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - already has active subscription',
  })
  @ApiResponse({ status: 404, description: 'Package not found' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  async subscribe(@Request() req, @Body() subscribeDto: SubscribeDto) {
    return this.subscriptionService.subscribeUser(
      req.user.userId,
      subscribeDto.packageId,
      subscribeDto.paymentReference,
    );
  }

  @Put(':id/renew')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Renew a subscription' })
  @ApiBody({ type: RenewSubscriptionDto })
  @ApiResponse({ status: 200, description: 'Successfully renewed' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot renew cancelled subscription',
  })
  @ApiBearerAuth('JWT-auth')
  async renewSubscription(
    @Param('id') subscriptionId: string,
    @Body() renewDto: RenewSubscriptionDto,
  ) {
    return this.subscriptionService.renewSubscription(
      subscriptionId,
      renewDto.paymentReference,
    );
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiBody({ type: CancelSubscriptionDto })
  @ApiResponse({ status: 200, description: 'Successfully cancelled' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({
    status: 400,
    description: 'Can only cancel active subscriptions',
  })
  @ApiBearerAuth('JWT-auth')
  async cancelSubscription(
    @Param('id') subscriptionId: string,
    @Body() cancelDto: CancelSubscriptionDto,
  ) {
    return this.subscriptionService.cancelSubscription(
      subscriptionId,
      cancelDto.reason,
    );
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get subscription statistics' })
  @ApiResponse({ status: 200, description: 'Subscription statistics' })
  @ApiBearerAuth('JWT-auth')
  async getStats(@Request() req) {
    return this.subscriptionService.getSubscriptionStats(req.user.userId);
  }
}
