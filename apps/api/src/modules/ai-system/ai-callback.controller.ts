import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { CallbackGuard } from './guards/callback.guard';
import { AiCallbackService } from './ai-callback.service';
import { AiCallbackDto } from './dto/ai-callback.dto';

@ApiTags('AI System - Callback')
@Controller('ai-system/ai')
export class AiCallbackController {
  constructor(private readonly service: AiCallbackService) {}

  @Post('callback')
  @Public()
  @UseGuards(CallbackGuard)
  @ApiOperation({ summary: 'AI 처리 결과 Callback (ku_ai_worker → HMAC 인증)' })
  callback(@Body() dto: AiCallbackDto) {
    return this.service.processCallback(dto);
  }
}
