import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecordingsService } from './recordings.service';
import { QuerySessionsDto, QueryFilesDto } from './dto/query-recordings.dto';

@ApiTags('녹화 이력/파일')
@ApiBearerAuth()
@Controller('recordings')
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  // ──────────────── 세션 이력 ────────────────

  @Get('sessions')
  @ApiOperation({ summary: '녹화 세션 이력 조회' })
  async findSessions(@Query() query: QuerySessionsDto) {
    const result = await this.recordingsService.findSessions(query);
    return { success: true, data: result };
  }

  @Get('sessions/:recSessionSeq')
  @ApiOperation({ summary: '녹화 세션 상세 조회' })
  async findSessionDetail(@Param('recSessionSeq', ParseIntPipe) recSessionSeq: number) {
    const result = await this.recordingsService.findSessionDetail(recSessionSeq);
    return { success: true, data: result };
  }

  // ──────────────── 파일 관리 ────────────────

  @Get('files')
  @ApiOperation({ summary: '녹화 파일 목록 조회' })
  async findFiles(@Query() query: QueryFilesDto) {
    const result = await this.recordingsService.findFiles(query);
    return { success: true, data: result };
  }

  @Get('files/:recFileSeq/download')
  @ApiOperation({ summary: '녹화 파일 다운로드' })
  async downloadFile(
    @Param('recFileSeq', ParseIntPipe) recFileSeq: number,
  ) {
    const result = await this.recordingsService.getFileForDownload(recFileSeq);
    return { success: true, data: result };
  }

  @Post('files/:recFileSeq/retry-upload')
  @ApiOperation({ summary: 'FTP 업로드 재시도' })
  async retryUpload(@Param('recFileSeq', ParseIntPipe) recFileSeq: number) {
    const result = await this.recordingsService.retryUpload(recFileSeq);
    return { success: true, data: result };
  }
}
