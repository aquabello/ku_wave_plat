import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlayLogsService } from './play-logs.service';
import { QueryPlayLogsDto } from './dto/query-play-logs.dto';
import { QueryStatsDto } from './dto/query-stats.dto';

@ApiTags('Play Logs')
@ApiBearerAuth()
@Controller()
export class PlayLogsController {
  constructor(private readonly playLogsService: PlayLogsService) {}

  @Get('players/:player_seq/play-logs')
  @ApiOperation({ summary: '재생 로그 조회 (플레이어별)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'ISO 8601 format' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'ISO 8601 format' })
  @ApiQuery({ name: 'status', required: false, enum: ['COMPLETED', 'SKIPPED', 'ERROR'] })
  @ApiQuery({ name: 'playlist_seq', required: false, type: Number })
  @ApiQuery({ name: 'content_seq', required: false, type: Number })
  @ApiResponse({ status: 200, description: '재생 로그 조회 성공' })
  @ApiResponse({ status: 404, description: '플레이어를 찾을 수 없음' })
  async getPlayerLogs(
    @Param('player_seq', ParseIntPipe) playerSeq: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: 'COMPLETED' | 'SKIPPED' | 'ERROR',
    @Query('playlist_seq', new ParseIntPipe({ optional: true })) playlist_seq?: number,
    @Query('content_seq', new ParseIntPipe({ optional: true })) content_seq?: number,
  ) {
    const data = await this.playLogsService.getPlayerLogs(playerSeq, {
      page,
      limit,
      from,
      to,
      status,
      playlist_seq,
      content_seq,
    });

    return {
      success: true,
      data,
    };
  }

  @Get('contents/:content_seq/play-stats')
  @ApiOperation({ summary: '재생 통계 조회 (콘텐츠별)' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'ISO 8601 format' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'ISO 8601 format' })
  @ApiResponse({ status: 200, description: '재생 통계 조회 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠를 찾을 수 없음' })
  async getContentStats(
    @Param('content_seq', ParseIntPipe) contentSeq: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const data = await this.playLogsService.getContentStats(contentSeq, {
      from,
      to,
    });

    return {
      success: true,
      data,
    };
  }
}
