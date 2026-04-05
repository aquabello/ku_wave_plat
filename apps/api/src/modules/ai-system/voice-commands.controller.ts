import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VoiceCommandsService } from './voice-commands.service';
import { CreateVoiceCommandDto } from './dto/create-voice-command.dto';
import { UpdateVoiceCommandDto } from './dto/update-voice-command.dto';
import { ListVoiceCommandsDto } from './dto/list-voice-commands.dto';

@ApiTags('AI System - 음성 명령어')
@ApiBearerAuth()
@Controller('ai-system/voice-commands')
export class VoiceCommandsController {
  constructor(private readonly service: VoiceCommandsService) {}

  @Get()
  @ApiOperation({ summary: '음성 명령어 목록 조회 (JWT 또는 X-API-Key)' })
  list(@Query() query: ListVoiceCommandsDto) {
    return this.service.list(query);
  }

  @Post()
  @ApiOperation({ summary: '음성 명령어 추가' })
  create(@Body() dto: CreateVoiceCommandDto) {
    return this.service.create(dto);
  }

  @Put(':voiceCommandSeq')
  @ApiOperation({ summary: '음성 명령어 수정' })
  update(
    @Param('voiceCommandSeq', ParseIntPipe) voiceCommandSeq: number,
    @Body() dto: UpdateVoiceCommandDto,
  ) {
    return this.service.update(voiceCommandSeq, dto);
  }

  @Delete(':voiceCommandSeq')
  @ApiOperation({ summary: '음성 명령어 삭제' })
  remove(@Param('voiceCommandSeq', ParseIntPipe) voiceCommandSeq: number) {
    return this.service.remove(voiceCommandSeq);
  }
}
