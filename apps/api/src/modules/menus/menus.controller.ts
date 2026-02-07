import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { GNBMenuItemDto, UserMenuResponseDto, UpdateUserMenusDto } from './dto';

@ApiTags('menus')
@ApiBearerAuth()
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get()
  @ApiOperation({ summary: '전체 메뉴 트리 조회 (GNB → LNB)' })
  @ApiResponse({
    status: 200,
    description: '메뉴 트리 조회 성공',
    type: [GNBMenuItemDto],
  })
  findAllMenuTree() {
    return this.menusService.findAllMenuTree();
  }

  @Get('users/:seq')
  @ApiOperation({ summary: '사용자별 메뉴 권한 조회' })
  @ApiParam({ name: 'seq', description: '사용자 시퀀스', example: 1, type: Number })
  @ApiResponse({
    status: 200,
    description: '사용자 메뉴 권한 조회 성공',
    type: UserMenuResponseDto,
  })
  @ApiResponse({ status: 404, description: '해당 회원을 찾을 수 없습니다' })
  findUserMenus(@Param('seq', ParseIntPipe) seq: number) {
    return this.menusService.findUserMenus(seq);
  }

  @Put('users/:seq')
  @ApiOperation({ summary: '사용자별 메뉴 권한 일괄 저장' })
  @ApiParam({ name: 'seq', description: '사용자 시퀀스', example: 1, type: Number })
  @ApiResponse({
    status: 200,
    description: '메뉴 권한이 저장되었습니다',
    type: UserMenuResponseDto,
  })
  @ApiResponse({ status: 404, description: '해당 회원을 찾을 수 없습니다' })
  updateUserMenus(
    @Param('seq', ParseIntPipe) seq: number,
    @Body() updateUserMenusDto: UpdateUserMenusDto,
  ) {
    return this.menusService.updateUserMenus(seq, updateUserMenusDto);
  }
}
