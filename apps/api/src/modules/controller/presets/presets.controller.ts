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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PresetsService } from './presets.service';
import {
  CreatePresetDto,
  UpdatePresetDto,
  PresetQueryDto,
  PresetListResponseDto,
} from './dto';
import { TbDevicePreset } from './entities/tb-device-preset.entity';

@ApiTags('controller/presets')
@ApiBearerAuth()
@Controller('controller/presets')
export class PresetsController {
  constructor(private readonly presetsService: PresetsService) {}

  @Get()
  @ApiOperation({ summary: '프리셋 리스트 조회 (페이징, 검색, 필터)' })
  @ApiResponse({
    status: 200,
    description: '프리셋 리스트 조회 성공',
    type: PresetListResponseDto,
  })
  findAll(@Query() query: PresetQueryDto): Promise<PresetListResponseDto> {
    return this.presetsService.findAll(query);
  }

  @Get(':presetSeq')
  @ApiOperation({ summary: '프리셋 상세 조회 (명령어 포함)' })
  @ApiParam({ name: 'presetSeq', description: '프리셋 시퀀스', example: 1, type: Number })
  @ApiResponse({
    status: 200,
    description: '프리셋 상세 조회 성공',
    type: TbDevicePreset,
  })
  @ApiResponse({ status: 404, description: '해당 프리셋을 찾을 수 없습니다' })
  findOne(@Param('presetSeq', ParseIntPipe) presetSeq: number): Promise<TbDevicePreset> {
    return this.presetsService.findOne(presetSeq);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '프리셋 생성 (명령어 포함)' })
  @ApiResponse({
    status: 201,
    description: '프리셋이 생성되었습니다',
    type: TbDevicePreset,
  })
  create(@Body() createPresetDto: CreatePresetDto): Promise<TbDevicePreset> {
    return this.presetsService.create(createPresetDto);
  }

  @Put(':presetSeq')
  @ApiOperation({ summary: '프리셋 수정 (명령어 동기화)' })
  @ApiParam({ name: 'presetSeq', description: '프리셋 시퀀스', example: 1, type: Number })
  @ApiResponse({
    status: 200,
    description: '프리셋이 수정되었습니다',
    type: TbDevicePreset,
  })
  @ApiResponse({ status: 404, description: '해당 프리셋을 찾을 수 없습니다' })
  update(
    @Param('presetSeq', ParseIntPipe) presetSeq: number,
    @Body() updatePresetDto: UpdatePresetDto,
  ): Promise<TbDevicePreset> {
    return this.presetsService.update(presetSeq, updatePresetDto);
  }

  @Delete(':presetSeq')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '프리셋 삭제 (소프트 삭제, 장비 연결 체크)' })
  @ApiParam({ name: 'presetSeq', description: '프리셋 시퀀스', example: 1, type: Number })
  @ApiResponse({
    status: 200,
    description: '프리셋이 삭제되었습니다',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '프리셋이 삭제되었습니다' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '해당 프리셋을 찾을 수 없습니다' })
  @ApiResponse({
    status: 409,
    description: '이 프리셋을 사용 중인 장비가 N개 있어 삭제할 수 없습니다',
  })
  async remove(@Param('presetSeq', ParseIntPipe) presetSeq: number) {
    await this.presetsService.softDelete(presetSeq);
    return { message: '프리셋이 삭제되었습니다' };
  }
}
