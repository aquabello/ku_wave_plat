import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import {
  ActivityLogQueryDto,
  ActivityLogDetailDto,
  ActivityLogListResponseDto,
} from './dto';

@ApiTags('activity-logs')
@ApiBearerAuth()
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @ApiOperation({ summary: '활동로그 리스트 조회 (페이징)' })
  @ApiResponse({
    status: 200,
    description: '활동로그 리스트 조회 성공',
    type: ActivityLogListResponseDto,
  })
  findAll(@Query() query: ActivityLogQueryDto, @Req() req: any) {
    const user = req.user;
    return this.activityLogsService.findAll(query, user);
  }

  @Get(':seq')
  @ApiOperation({ summary: '활동로그 상세 조회' })
  @ApiParam({ name: 'seq', description: '로그 시퀀스', example: 1, type: Number })
  @ApiResponse({ status: 200, description: '활동로그 상세 조회 성공', type: ActivityLogDetailDto })
  @ApiResponse({ status: 404, description: '해당 활동로그를 찾을 수 없습니다' })
  findOne(@Param('seq', ParseIntPipe) seq: number, @Req() req: any) {
    const user = req.user;
    return this.activityLogsService.findOne(seq, user);
  }
}
