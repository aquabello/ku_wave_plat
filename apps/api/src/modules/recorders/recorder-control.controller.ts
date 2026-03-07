import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecorderControlService } from './recorder-control.service';
import { PtzCommandDto } from './dto/ptz-command.dto';
import { RecordingStartDto } from './dto/recording-command.dto';

@ApiTags('녹화기 제어')
@ApiBearerAuth()
@Controller('recorders')
export class RecorderControlController {
  constructor(private readonly controlService: RecorderControlService) {}

  @Post(':recorderSeq/control/ptz')
  @ApiOperation({ summary: 'PTZ 명령 전송' })
  async sendPtz(
    @Param('recorderSeq', ParseIntPipe) recorderSeq: number,
    @Body() dto: PtzCommandDto,
    @Request() req: { user?: { seq: number } },
  ) {
    const result = await this.controlService.sendPtzCommand(recorderSeq, dto, req.user?.seq);
    return { success: true, data: result };
  }

  @Post(':recorderSeq/control/record/start')
  @ApiOperation({ summary: '녹화 시작' })
  async startRecording(
    @Param('recorderSeq', ParseIntPipe) recorderSeq: number,
    @Body() dto: RecordingStartDto,
    @Request() req: { user?: { seq: number } },
  ) {
    const result = await this.controlService.startRecording(recorderSeq, dto, req.user?.seq);
    return { success: true, data: result };
  }

  @Post(':recorderSeq/control/record/stop')
  @ApiOperation({ summary: '녹화 종료' })
  async stopRecording(
    @Param('recorderSeq', ParseIntPipe) recorderSeq: number,
    @Request() req: { user?: { seq: number } },
  ) {
    const result = await this.controlService.stopRecording(recorderSeq, req.user?.seq);
    return { success: true, data: result };
  }

  @Post(':recorderSeq/control/preset/:recPresetSeq')
  @ApiOperation({ summary: '프리셋 적용' })
  async applyPreset(
    @Param('recorderSeq', ParseIntPipe) recorderSeq: number,
    @Param('recPresetSeq', ParseIntPipe) recPresetSeq: number,
    @Request() req: { user?: { seq: number } },
  ) {
    const result = await this.controlService.applyPreset(recorderSeq, recPresetSeq, req.user?.seq);
    return { success: true, data: result };
  }

  @Get(':recorderSeq/control/status')
  @ApiOperation({ summary: '녹화기 실시간 상태 조회' })
  async getStatus(@Param('recorderSeq', ParseIntPipe) recorderSeq: number) {
    const result = await this.controlService.getStatus(recorderSeq);
    return { success: true, data: result };
  }
}
