import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { PermissionQueryDto, PermissionListResponseDto } from './dto';

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
}
