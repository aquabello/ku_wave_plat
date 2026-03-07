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
import { RecordersService } from './recorders.service';
import { CreateRecorderDto } from './dto/create-recorder.dto';
import { UpdateRecorderDto } from './dto/update-recorder.dto';
import { ListRecordersDto } from './dto/list-recorders.dto';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';
import { QueryLogsDto } from './dto/query-logs.dto';

@ApiTags('녹화기 관리')
@ApiBearerAuth()
@Controller('recorders')
export class RecordersController {
  constructor(private readonly recordersService: RecordersService) {}

  // ──────────────── 녹화기 CRUD ────────────────

  @Get()
  @ApiOperation({ summary: '녹화기 목록 조회' })
  async findAll(@Query() query: ListRecordersDto) {
    const result = await this.recordersService.findAll(query);
    return { success: true, data: result };
  }

  @Get(':recorderSeq')
  @ApiOperation({ summary: '녹화기 상세 조회' })
  async findOne(@Param('recorderSeq', ParseIntPipe) recorderSeq: number) {
    const result = await this.recordersService.findOne(recorderSeq);
    return { success: true, data: result };
  }

  @Post()
  @ApiOperation({ summary: '녹화기 등록' })
  async create(@Body() dto: CreateRecorderDto) {
    const result = await this.recordersService.create(dto);
    return { success: true, data: result };
  }

  @Put(':recorderSeq')
  @ApiOperation({ summary: '녹화기 수정' })
  async update(
    @Param('recorderSeq', ParseIntPipe) recorderSeq: number,
    @Body() dto: UpdateRecorderDto,
  ) {
    const result = await this.recordersService.update(recorderSeq, dto);
    return { success: true, data: result };
  }

  @Delete(':recorderSeq')
  @ApiOperation({ summary: '녹화기 삭제' })
  async remove(@Param('recorderSeq', ParseIntPipe) recorderSeq: number) {
    const result = await this.recordersService.remove(recorderSeq);
    return { success: true, data: result };
  }

  // ──────────────── 프리셋 CRUD ────────────────

  @Get(':recorderSeq/presets')
  @ApiOperation({ summary: '프리셋 목록 조회' })
  async findPresets(@Param('recorderSeq', ParseIntPipe) recorderSeq: number) {
    const result = await this.recordersService.findPresets(recorderSeq);
    return { success: true, data: result };
  }

  @Post(':recorderSeq/presets')
  @ApiOperation({ summary: '프리셋 등록' })
  async createPreset(
    @Param('recorderSeq', ParseIntPipe) recorderSeq: number,
    @Body() dto: CreatePresetDto,
  ) {
    const result = await this.recordersService.createPreset(recorderSeq, dto);
    return { success: true, data: result };
  }

  @Put(':recorderSeq/presets/:recPresetSeq')
  @ApiOperation({ summary: '프리셋 수정' })
  async updatePreset(
    @Param('recorderSeq', ParseIntPipe) recorderSeq: number,
    @Param('recPresetSeq', ParseIntPipe) recPresetSeq: number,
    @Body() dto: UpdatePresetDto,
  ) {
    const result = await this.recordersService.updatePreset(recorderSeq, recPresetSeq, dto);
    return { success: true, data: result };
  }

  @Delete(':recorderSeq/presets/:recPresetSeq')
  @ApiOperation({ summary: '프리셋 삭제' })
  async removePreset(
    @Param('recorderSeq', ParseIntPipe) recorderSeq: number,
    @Param('recPresetSeq', ParseIntPipe) recPresetSeq: number,
  ) {
    const result = await this.recordersService.removePreset(recorderSeq, recPresetSeq);
    return { success: true, data: result };
  }

  // ──────────────── 로그 조회 ────────────────

  @Get(':recorderSeq/logs')
  @ApiOperation({ summary: '녹화기 명령 로그 조회' })
  async findLogs(
    @Param('recorderSeq', ParseIntPipe) recorderSeq: number,
    @Query() query: QueryLogsDto,
  ) {
    const result = await this.recordersService.findLogs(recorderSeq, query);
    return { success: true, data: result };
  }
}
