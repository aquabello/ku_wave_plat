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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlayerGroupsService } from './player-groups.service';
import { CreatePlayerGroupDto } from './dto/create-player-group.dto';
import { UpdatePlayerGroupDto } from './dto/update-player-group.dto';
import { AddMembersDto } from './dto/add-members.dto';

@ApiTags('Player Groups')
@ApiBearerAuth()
@Controller('player-groups')
export class PlayerGroupsController {
  constructor(private readonly playerGroupsService: PlayerGroupsService) {}

  @Get()
  @ApiOperation({ summary: '플레이어 그룹 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'building_seq', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: '그룹 목록 조회 성공' })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('building_seq', new ParseIntPipe({ optional: true })) building_seq?: number,
    @Query('search') search?: string,
  ) {
    const data = await this.playerGroupsService.findAll({
      page,
      limit,
      building_seq,
      search,
    });

    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '플레이어 그룹 상세 조회' })
  @ApiResponse({ status: 200, description: '그룹 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '그룹을 찾을 수 없음' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.playerGroupsService.findOne(id);

    return {
      success: true,
      data,
    };
  }

  @Post()
  @ApiOperation({ summary: '플레이어 그룹 등록' })
  @ApiResponse({ status: 201, description: '그룹 등록 성공' })
  @ApiResponse({ status: 400, description: '유효성 검증 실패' })
  async create(@Body() dto: CreatePlayerGroupDto) {
    const data = await this.playerGroupsService.create(dto);

    return {
      success: true,
      message: '플레이어 그룹이 등록되었습니다.',
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '플레이어 그룹 수정' })
  @ApiResponse({ status: 200, description: '그룹 수정 성공' })
  @ApiResponse({ status: 404, description: '그룹을 찾을 수 없음' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePlayerGroupDto) {
    const data = await this.playerGroupsService.update(id, dto);

    return {
      success: true,
      message: '플레이어 그룹이 수정되었습니다.',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '플레이어 그룹 삭제 (소프트 삭제)' })
  @ApiResponse({ status: 200, description: '그룹 삭제 성공' })
  @ApiResponse({ status: 404, description: '그룹을 찾을 수 없음' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.playerGroupsService.remove(id);

    return {
      success: true,
      message: '플레이어 그룹이 삭제되었습니다.',
    };
  }

  @Post(':id/members')
  @ApiOperation({ summary: '그룹 멤버 추가' })
  @ApiResponse({ status: 201, description: '멤버 추가 성공' })
  @ApiResponse({ status: 400, description: '유효성 검증 실패' })
  @ApiResponse({ status: 404, description: '그룹을 찾을 수 없음' })
  async addMembers(@Param('id', ParseIntPipe) id: number, @Body() dto: AddMembersDto) {
    const data = await this.playerGroupsService.addMembers(id, dto);

    return {
      success: true,
      message: '그룹 멤버가 추가되었습니다.',
      data,
    };
  }

  @Delete(':id/members/:player_id')
  @ApiOperation({ summary: '그룹 멤버 삭제' })
  @ApiResponse({ status: 200, description: '멤버 삭제 성공' })
  @ApiResponse({ status: 404, description: '멤버를 찾을 수 없음' })
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('player_id', ParseIntPipe) playerId: number,
  ) {
    await this.playerGroupsService.removeMember(id, playerId);

    return {
      success: true,
      message: '그룹 멤버가 삭제되었습니다.',
    };
  }
}
