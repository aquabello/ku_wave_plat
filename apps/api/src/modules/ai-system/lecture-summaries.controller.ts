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
import { LectureSummariesService } from './lecture-summaries.service';
import { ListLectureSummariesDto } from './dto/list-lecture-summaries.dto';
import { CreateLectureSummaryDto } from './dto/create-lecture-summary.dto';
import { UpdateLectureSummaryStatusDto } from './dto/update-lecture-summary-status.dto';
import { UpdateLectureSummaryResultDto } from './dto/update-lecture-summary-result.dto';

@ApiTags('AI System - 강의요약')
@ApiBearerAuth()
@Controller('ai-system/lecture-summaries')
export class LectureSummariesController {
  constructor(private readonly service: LectureSummariesService) {}

  @Get()
  @ApiOperation({ summary: '강의요약 목록 조회' })
  list(@Query() query: ListLectureSummariesDto) {
    return this.service.list(query);
  }

  @Get(':summarySeq')
  @ApiOperation({ summary: '강의요약 상세 조회' })
  findOne(@Param('summarySeq', ParseIntPipe) summarySeq: number) {
    return this.service.findOne(summarySeq);
  }

  @Post()
  @ApiOperation({ summary: '강의요약 레코드 생성 (MiniPC)' })
  create(@Body() dto: CreateLectureSummaryDto) {
    return this.service.create(dto);
  }

  @Put(':summarySeq/status')
  @ApiOperation({ summary: '강의요약 상태 변경 (MiniPC)' })
  updateStatus(
    @Param('summarySeq', ParseIntPipe) summarySeq: number,
    @Body() dto: UpdateLectureSummaryStatusDto,
  ) {
    return this.service.updateStatus(summarySeq, dto);
  }

  @Put(':summarySeq/result')
  @ApiOperation({ summary: '강의요약 결과 저장 (MiniPC)' })
  updateResult(
    @Param('summarySeq', ParseIntPipe) summarySeq: number,
    @Body() dto: UpdateLectureSummaryResultDto,
  ) {
    return this.service.updateResult(summarySeq, dto);
  }

  @Delete(':summarySeq')
  @ApiOperation({ summary: '강의요약 삭제' })
  remove(@Param('summarySeq', ParseIntPipe) summarySeq: number) {
    return this.service.remove(summarySeq);
  }
}
