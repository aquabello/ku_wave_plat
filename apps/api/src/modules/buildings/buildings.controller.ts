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
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto, UpdateBuildingDto, BuildingQueryDto, BuildingListResponseDto } from './dto';

@ApiTags('buildings')
@ApiBearerAuth()
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  @ApiOperation({ summary: '건물 리스트 조회 (페이징)' })
  @ApiResponse({
    status: 200,
    description: '건물 리스트 조회 성공',
    type: BuildingListResponseDto,
  })
  findAll(@Query() query: BuildingQueryDto) {
    return this.buildingsService.findAll(query);
  }

  @Get(':seq')
  @ApiOperation({ summary: '건물 상세 조회' })
  @ApiParam({ name: 'seq', description: '건물 시퀀스', example: 1, type: Number })
  @ApiResponse({ status: 200, description: '건물 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '해당 건물을 찾을 수 없습니다' })
  findOne(@Param('seq', ParseIntPipe) seq: number) {
    return this.buildingsService.findOne(seq);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '건물 등록' })
  @ApiResponse({ status: 201, description: '건물이 등록되었습니다' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 건물 코드입니다' })
  create(@Body() createBuildingDto: CreateBuildingDto) {
    return this.buildingsService.create(createBuildingDto);
  }

  @Put(':seq')
  @ApiOperation({ summary: '건물 수정' })
  @ApiParam({ name: 'seq', description: '건물 시퀀스', example: 1, type: Number })
  @ApiResponse({ status: 200, description: '건물이 수정되었습니다' })
  @ApiResponse({ status: 404, description: '해당 건물을 찾을 수 없습니다' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 건물 코드입니다' })
  update(
    @Param('seq', ParseIntPipe) seq: number,
    @Body() updateBuildingDto: UpdateBuildingDto,
  ) {
    return this.buildingsService.update(seq, updateBuildingDto);
  }

  @Delete(':seq')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '건물 삭제 (소프트 삭제)' })
  @ApiParam({ name: 'seq', description: '건물 시퀀스', example: 1, type: Number })
  @ApiResponse({
    status: 200,
    description: '건물이 삭제되었습니다',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '건물이 삭제되었습니다' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '해당 건물을 찾을 수 없습니다' })
  async remove(@Param('seq', ParseIntPipe) seq: number) {
    await this.buildingsService.softDelete(seq);
    return { message: '건물이 삭제되었습니다' };
  }
}
