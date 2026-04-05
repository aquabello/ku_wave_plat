import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { AiPcApiKeyGuard } from './guards/ai-pc-api-key.guard';
import { SpeechSessionsService } from './speech-sessions.service';
import { VoiceCommandsService } from './voice-commands.service';
import { ListSpeechSessionsDto } from './dto/list-speech-sessions.dto';
import { CreateSpeechSessionDto } from './dto/create-speech-session.dto';
import { EndSpeechSessionDto } from './dto/end-speech-session.dto';
import { CreateSpeechLogDto } from './dto/create-speech-log.dto';
import { CreateCommandLogDto } from './dto/create-command-log.dto';
import { ExecuteCommandDto } from './dto/execute-command.dto';

@ApiTags('AI System - 음성인식')
@ApiBearerAuth()
@Controller('ai-system')
export class SpeechSessionsController {
  constructor(
    private readonly sessionsService: SpeechSessionsService,
    private readonly voiceCommandsService: VoiceCommandsService,
  ) {}

  @Get('speech-sessions')
  @ApiOperation({ summary: '음성인식 세션 목록 조회' })
  listSessions(@Query() query: ListSpeechSessionsDto) {
    return this.sessionsService.list(query);
  }

  @Get('speech-sessions/:sessionSeq')
  @ApiOperation({ summary: '음성인식 세션 상세 조회' })
  findOneSession(@Param('sessionSeq', ParseIntPipe) sessionSeq: number) {
    return this.sessionsService.findOne(sessionSeq);
  }

  @Post('speech-sessions')
  @Public()
  @UseGuards(AiPcApiKeyGuard)
  @ApiHeader({ name: 'X-API-Key', description: 'AI PC API Key', required: true })
  @ApiOperation({ summary: '음성인식 세션 생성 (ku_ai_pc → X-API-Key)' })
  createSession(@Body() dto: CreateSpeechSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Put('speech-sessions/:sessionSeq/end')
  @Public()
  @UseGuards(AiPcApiKeyGuard)
  @ApiHeader({ name: 'X-API-Key', description: 'AI PC API Key', required: true })
  @ApiOperation({ summary: '음성인식 세션 종료 (ku_ai_pc → X-API-Key)' })
  endSession(
    @Param('sessionSeq', ParseIntPipe) sessionSeq: number,
    @Body() dto: EndSpeechSessionDto,
  ) {
    return this.sessionsService.end(sessionSeq, dto);
  }

  @Post('speech-logs')
  @Public()
  @UseGuards(AiPcApiKeyGuard)
  @ApiHeader({ name: 'X-API-Key', description: 'AI PC API Key', required: true })
  @ApiOperation({ summary: 'STT 로그 저장 (ku_ai_pc → X-API-Key)' })
  createSpeechLog(@Body() dto: CreateSpeechLogDto) {
    return this.sessionsService.createSpeechLog(dto);
  }

  @Post('commands/execute')
  @Public()
  @UseGuards(AiPcApiKeyGuard)
  @ApiHeader({ name: 'X-API-Key', description: 'AI PC API Key', required: true })
  @ApiOperation({ summary: 'Voice Detect 장비 제어 실행 (ku_ai_pc → X-API-Key)' })
  executeCommand(@Body() dto: ExecuteCommandDto) {
    return this.voiceCommandsService.executeCommand(dto, null);
  }

  @Post('command-logs')
  @Public()
  @UseGuards(AiPcApiKeyGuard)
  @ApiHeader({ name: 'X-API-Key', description: 'AI PC API Key', required: true })
  @ApiOperation({ summary: '명령 로그 수동 저장 (ku_ai_pc → X-API-Key)' })
  createCommandLog(@Body() dto: CreateCommandLogDto) {
    return this.sessionsService.createCommandLog(dto);
  }
}
