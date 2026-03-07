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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: '음성인식 세션 생성 (MiniPC)' })
  createSession(@Body() dto: CreateSpeechSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Put('speech-sessions/:sessionSeq/end')
  @ApiOperation({ summary: '음성인식 세션 종료 (MiniPC)' })
  endSession(
    @Param('sessionSeq', ParseIntPipe) sessionSeq: number,
    @Body() dto: EndSpeechSessionDto,
  ) {
    return this.sessionsService.end(sessionSeq, dto);
  }

  @Post('speech-logs')
  @ApiOperation({ summary: 'STT 로그 저장 (MiniPC)' })
  createSpeechLog(@Body() dto: CreateSpeechLogDto) {
    return this.sessionsService.createSpeechLog(dto);
  }

  @Post('commands/execute')
  @ApiOperation({ summary: 'Voice Detect 장비 제어 실행 (MiniPC)' })
  executeCommand(@Body() dto: ExecuteCommandDto, @Request() req: any) {
    const tuSeq = req.user?.seq ?? 0;
    return this.voiceCommandsService.executeCommand(dto, tuSeq);
  }

  @Post('command-logs')
  @ApiOperation({ summary: '명령 로그 수동 저장 (MiniPC)' })
  createCommandLog(@Body() dto: CreateCommandLogDto) {
    return this.sessionsService.createCommandLog(dto);
  }
}
