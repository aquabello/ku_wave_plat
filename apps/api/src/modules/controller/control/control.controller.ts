import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ControlService } from './control.service';
import {
  ExecuteCommandDto,
  ExecuteBatchDto,
  ControlLogQueryDto,
  ControlLogResponseDto,
} from './dto';

@ApiTags('controller - control')
@ApiBearerAuth()
@Controller('controller/control')
export class ControlController {
  constructor(private readonly controlService: ControlService) {}

  @Get('spaces')
  @ApiOperation({ summary: '제어관리 메인 화면용 공간 목록 조회 (건물 기준)' })
  @ApiQuery({ name: 'buildingSeq', description: '건물 시퀀스', required: true, type: Number })
  @ApiQuery({ name: 'search', description: '공간명 검색', required: false, type: String })
  @ApiResponse({ status: 200, description: '공간 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '해당 건물을 찾을 수 없습니다' })
  getControlSpaces(
    @Query('buildingSeq', ParseIntPipe) buildingSeq: number,
    @Query('search') search?: string,
  ) {
    return this.controlService.getControlSpaces(buildingSeq, search);
  }

  @Get('spaces/:spaceSeq/devices')
  @ApiOperation({ summary: '공간별 장비 목록 조회 (장비등록/장비제어 공용)' })
  @ApiParam({ name: 'spaceSeq', description: '공간 시퀀스', type: Number })
  @ApiResponse({ status: 200, description: '장비 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '해당 공간을 찾을 수 없습니다' })
  getSpaceDevices(
    @Param('spaceSeq', ParseIntPipe) spaceSeq: number,
  ) {
    return this.controlService.getSpaceDevices(spaceSeq);
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '단일 장비 명령어 실행' })
  @ApiResponse({ status: 200, description: '명령어 실행 완료' })
  @ApiResponse({ status: 404, description: '해당 장비 또는 명령어를 찾을 수 없습니다' })
  @ApiResponse({ status: 422, description: '장비가 비활성 상태(INACTIVE)입니다' })
  execute(
    @Body() dto: ExecuteCommandDto,
    @Req() req: any,
  ) {
    return this.controlService.execute(dto, req.user.seq);
  }

  @Post('execute-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '공간 일괄 제어 (같은 유형 명령어 전체 실행)' })
  @ApiResponse({ status: 200, description: '일괄 제어 완료' })
  @ApiResponse({ status: 404, description: '해당 공간을 찾을 수 없습니다' })
  executeBatch(
    @Body() dto: ExecuteBatchDto,
    @Req() req: any,
  ) {
    return this.controlService.executeBatch(dto, req.user.seq);
  }

  @Get('logs')
  @ApiOperation({ summary: '제어 로그 조회 (페이징)' })
  @ApiResponse({
    status: 200,
    description: '제어 로그 조회 성공',
    type: ControlLogResponseDto,
  })
  getLogs(@Query() query: ControlLogQueryDto) {
    return this.controlService.getLogs(query);
  }

  @Delete('logs')
  @ApiOperation({ summary: '제어 로그 초기화 (전체 삭제)' })
  @ApiResponse({ status: 200, description: '제어 로그 초기화 완료' })
  clearLogs() {
    return this.controlService.clearLogs();
  }
}
