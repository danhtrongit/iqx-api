import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /api/chat
   * Send a message to AriX AI for stock analysis
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async chat(@Request() req, @Body() chatRequest: ChatRequestDto) {
    const userId = req.user.id;
    return this.chatService.chat(userId, chatRequest);
  }

  /**
   * GET /api/chat/usage
   * Get current API usage info for the authenticated user
   */
  @Get('usage')
  async getUsage(@Request() req) {
    const userId = req.user.id;
    return this.chatService.getUserApiUsage(userId);
  }

  /**
   * GET /api/chat/stats
   * Get API usage statistics for the authenticated user
   */
  @Get('stats')
  async getStats(@Request() req, @Query('days') days?: string) {
    const userId = req.user.id;
    const daysNumber = days ? parseInt(days, 10) : 7;
    return this.chatService.getUserUsageStats(userId, daysNumber);
  }
}

