import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  Header,
  StreamableFile,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import * as fs from 'fs';
import { Public } from '@common/decorators/public.decorator';
import { RecordingsService } from './recordings.service';
import { QuerySessionsDto, QueryFilesDto } from './dto/query-recordings.dto';
import { FtpService } from '@modules/ftp/ftp.service';

@ApiTags('녹화 이력/파일')
@ApiBearerAuth()
@Controller('recordings')
export class RecordingsController {
  constructor(
    private readonly recordingsService: RecordingsService,
    private readonly ftpService: FtpService,
  ) {}

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

  @Public()
  @Get('files/:recFileSeq/download')
  @ApiOperation({ summary: '녹화 파일 다운로드 (캐시 → FTP)' })
  @Header('Content-Type', 'video/mp4')
  async downloadFile(
    @Param('recFileSeq', ParseIntPipe) recFileSeq: number,
  ) {
    const fileInfo = await this.recordingsService.getFileForDownload(recFileSeq);
    if (!fileInfo.filePath) {
      throw new NotFoundException('파일 경로가 없습니다.');
    }
    const localPath = await this.ftpService.getFileWithCache(recFileSeq, fileInfo.filePath);
    const stream = fs.createReadStream(localPath);
    return new StreamableFile(stream, {
      type: 'video/mp4',
      disposition: `attachment; filename="${encodeURIComponent(fileInfo.fileName)}"`,
    });
  }

  @Public()
  @Get('files/:recFileSeq/preview')
  @ApiOperation({ summary: '녹화 파일 미리보기 (캐시 → FTP)' })
  @Header('Content-Type', 'video/mp4')
  async previewFile(
    @Param('recFileSeq', ParseIntPipe) recFileSeq: number,
  ) {
    const fileInfo = await this.recordingsService.getFileForPreview(recFileSeq);
    if (!fileInfo.filePath) {
      throw new NotFoundException('파일 경로가 없습니다.');
    }
    const localPath = await this.ftpService.getFileWithCache(recFileSeq, fileInfo.filePath);
    const stream = fs.createReadStream(localPath);
    return new StreamableFile(stream, {
      type: 'video/mp4',
    });
  }

  @Post('files/:recFileSeq/retry-upload')
  @ApiOperation({ summary: 'FTP 업로드 재시도' })
  async retryUpload(@Param('recFileSeq', ParseIntPipe) recFileSeq: number) {
    const result = await this.recordingsService.retryUpload(recFileSeq);
    return { success: true, data: result };
  }
}
