import { Controller, Get, Put, Query, Param, Body, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { PermissionQueryDto, PermissionListResponseDto, AssignBuildingsDto } from './dto';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: '권한 목록 조회 (사용자 + 할당 메뉴/건물)' })
  @ApiResponse({
    status: 200,
    description: '권한 목록 조회 성공',
    type: PermissionListResponseDto,
  })
  findAll(@Query() query: PermissionQueryDto) {
    return this.permissionsService.findAll(query);
  }

  @Put(':userSeq/buildings')
  @ApiOperation({ summary: '사용자 건물 할당 (전체 교체)' })
  @ApiParam({ name: 'userSeq', description: '사용자 시퀀스', example: 2, type: Number })
  @ApiResponse({
    status: 200,
    description: '건물 할당 성공',
    schema: {
      example: {
        message: '건물 할당이 완료되었습니다',
        assignedBuildings: ['공학관 A동', '인문학관'],
      },
    },
  })
  @ApiResponse({ status: 404, description: '해당 회원 또는 건물을 찾을 수 없습니다' })
  assignBuildings(
    @Param('userSeq', ParseIntPipe) userSeq: number,
    @Body() dto: AssignBuildingsDto,
  ) {
    return this.permissionsService.assignBuildings(userSeq, dto);
  }
}
