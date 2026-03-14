import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
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
  @ApiResponse({ status: 200, description: '파일 경로 및 메타데이터 반환' })
  @ApiResponse({ status: 403, description: '접근 권한 없음 (녹화 진행자만 가능)' })
  @ApiResponse({ status: 404, description: '파일 없음' })
  async downloadFile(
    @Param('recFileSeq', ParseIntPipe) recFileSeq: number,
    @Request() req: { user: { seq: number } },
  ) {
    const result = await this.recordingsService.getFileForDownload(recFileSeq, req.user.seq);
    return { success: true, data: result };
  }

  @Get('files/:recFileSeq/preview')
  @ApiOperation({ summary: '녹화 파일 미리보기 정보' })
  @ApiResponse({ status: 200, description: '미리보기용 메타데이터 및 경로 반환' })
  @ApiResponse({ status: 403, description: '접근 권한 없음 (녹화 진행자만 가능)' })
  @ApiResponse({ status: 404, description: '파일 없음' })
  async previewFile(
    @Param('recFileSeq', ParseIntPipe) recFileSeq: number,
    @Request() req: { user: { seq: number } },
  ) {
    const result = await this.recordingsService.getFileForPreview(recFileSeq, req.user.seq);
    return { success: true, data: result };
  }

  @Post('files/:recFileSeq/retry-upload')
  @ApiOperation({ summary: 'FTP 업로드 재시도' })
  async retryUpload(@Param('recFileSeq', ParseIntPipe) recFileSeq: number) {
    const result = await this.recordingsService.retryUpload(recFileSeq);
    return { success: true, data: result };
  }
}
