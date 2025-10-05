import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Message không được để trống' })
  message: string;

  @IsString()
  @IsOptional()
  model?: string;
}

export class ChatResponseDto {
  success: boolean;
  type: 'stock_analysis' | 'general_chat';
  ticker?: string;
  message: string;
  queryAnalysis: {
    intent: string;
    confidence: number;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ApiUsageInfoDto {
  currentUsage: number;
  limit: number;
  remaining: number;
  resetDate: string;
}

