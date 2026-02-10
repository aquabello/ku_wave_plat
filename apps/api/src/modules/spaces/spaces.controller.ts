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
import { SpacesService } from './spaces.service';
import { CreateSpaceDto, UpdateSpaceDto, SpaceQueryDto, SpaceListResponseDto } from './dto';

@ApiTags('spaces')
@ApiBearerAuth()
@Controller('buildings/:buildingSeq/spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get()
  @ApiOperation({ summary: '공간 리스트 조회 (건물별, 페이징)' })
  @ApiParam({ name: 'buildingSeq', description: '건물 시퀀스', example: 1, type: Number })
  @ApiResponse({
    status: 200,
    description: '공간 리스트 조회 성공',
    type: SpaceListResponseDto,
  })
  @ApiResponse({ status: 404, description: '해당 건물을 찾을 수 없습니다' })
  findAll(
    @Param('buildingSeq', ParseIntPipe) buildingSeq: number,
    @Query() query: SpaceQueryDto,
  ) {
    return this.spacesService.findAll(buildingSeq, query);
  }

  @Get(':spaceSeq')
  @ApiOperation({ summary: '공간 상세 조회' })
  @ApiParam({ name: 'buildingSeq', description: '건물 시퀀스', example: 1, type: Number })
  @ApiParam({ name: 'spaceSeq', description: '공간 시퀀스', example: 1, type: Number })
  @ApiResponse({ status: 200, description: '공간 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '해당 공간을 찾을 수 없습니다' })
  findOne(
    @Param('buildingSeq', ParseIntPipe) buildingSeq: number,
    @Param('spaceSeq', ParseIntPipe) spaceSeq: number,
  ) {
    return this.spacesService.findOne(buildingSeq, spaceSeq);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '공간 등록' })
  @ApiParam({ name: 'buildingSeq', description: '건물 시퀀스', example: 1, type: Number })
  @ApiResponse({ status: 201, description: '공간이 등록되었습니다' })
  @ApiResponse({ status: 404, description: '해당 건물을 찾을 수 없습니다' })
  create(
    @Param('buildingSeq', ParseIntPipe) buildingSeq: number,
    @Body() createSpaceDto: CreateSpaceDto,
  ) {
    return this.spacesService.create(buildingSeq, createSpaceDto);
  }

  @Put(':spaceSeq')
  @ApiOperation({ summary: '공간 수정' })
  @ApiParam({ name: 'buildingSeq', description: '건물 시퀀스', example: 1, type: Number })
  @ApiParam({ name: 'spaceSeq', description: '공간 시퀀스', example: 1, type: Number })
  @ApiResponse({ status: 200, description: '공간이 수정되었습니다' })
  @ApiResponse({ status: 404, description: '해당 공간을 찾을 수 없습니다' })
  update(
    @Param('buildingSeq', ParseIntPipe) buildingSeq: number,
    @Param('spaceSeq', ParseIntPipe) spaceSeq: number,
    @Body() updateSpaceDto: UpdateSpaceDto,
  ) {
    return this.spacesService.update(buildingSeq, spaceSeq, updateSpaceDto);
  }

  @Delete(':spaceSeq')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '공간 삭제 (소프트 삭제)' })
  @ApiParam({ name: 'buildingSeq', description: '건물 시퀀스', example: 1, type: Number })
  @ApiParam({ name: 'spaceSeq', description: '공간 시퀀스', example: 1, type: Number })
  @ApiResponse({
    status: 200,
    description: '공간이 삭제되었습니다',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '공간이 삭제되었습니다' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '해당 공간을 찾을 수 없습니다' })
  async remove(
    @Param('buildingSeq', ParseIntPipe) buildingSeq: number,
    @Param('spaceSeq', ParseIntPipe) spaceSeq: number,
  ) {
    await this.spacesService.softDelete(buildingSeq, spaceSeq);
    return { message: '공간이 삭제되었습니다' };
  }
}
