import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlayerPlaylistsService } from './player-playlists.service';
import { AssignPlayerPlaylistDto } from './dto/assign-player-playlist.dto';
import { UpdatePlayerPlaylistDto } from './dto/update-player-playlist.dto';
import { AssignGroupPlaylistDto } from './dto/assign-group-playlist.dto';
import { UpdateGroupPlaylistDto } from './dto/update-group-playlist.dto';

@ApiTags('Player Playlists')
@ApiBearerAuth()
@Controller()
export class PlayerPlaylistsController {
  constructor(private readonly playerPlaylistsService: PlayerPlaylistsService) {}

  // Player Playlist Endpoints
  @Get('players/:player_seq/playlists')
  @ApiOperation({ summary: '플레이어 플레이리스트 할당 목록 조회' })
  @ApiResponse({ status: 200, description: '할당 목록 조회 성공' })
  async getPlayerPlaylists(@Param('player_seq', ParseIntPipe) playerSeq: number) {
    const data = await this.playerPlaylistsService.getPlayerPlaylists(playerSeq);

    return {
      success: true,
      data,
    };
  }

  @Post('players/:player_seq/playlists')
  @ApiOperation({ summary: '플레이어에 플레이리스트 할당' })
  @ApiResponse({ status: 201, description: '플레이리스트 할당 성공' })
  @ApiResponse({ status: 400, description: '유효성 검증 실패 또는 중복 할당' })
  @ApiResponse({ status: 404, description: '플레이어 또는 플레이리스트를 찾을 수 없음' })
  async assignPlaylistToPlayer(
    @Param('player_seq', ParseIntPipe) playerSeq: number,
    @Body() dto: AssignPlayerPlaylistDto,
  ) {
    const data = await this.playerPlaylistsService.assignPlaylistToPlayer(playerSeq, dto);

    return {
      success: true,
      message: '플레이리스트가 할당되었습니다.',
      data,
    };
  }

  @Put('players/:player_seq/playlists/:pp_seq')
  @ApiOperation({ summary: '플레이어 플레이리스트 할당 수정' })
  @ApiResponse({ status: 200, description: '할당 수정 성공' })
  @ApiResponse({ status: 404, description: '할당을 찾을 수 없음' })
  async updatePlayerPlaylist(
    @Param('player_seq', ParseIntPipe) playerSeq: number,
    @Param('pp_seq', ParseIntPipe) ppSeq: number,
    @Body() dto: UpdatePlayerPlaylistDto,
  ) {
    const data = await this.playerPlaylistsService.updatePlayerPlaylist(playerSeq, ppSeq, dto);

    return {
      success: true,
      message: '플레이리스트 할당이 수정되었습니다.',
      data,
    };
  }

  @Delete('players/:player_seq/playlists/:pp_seq')
  @ApiOperation({ summary: '플레이어 플레이리스트 할당 해제' })
  @ApiResponse({ status: 200, description: '할당 해제 성공' })
  @ApiResponse({ status: 404, description: '할당을 찾을 수 없음' })
  async removePlayerPlaylist(
    @Param('player_seq', ParseIntPipe) playerSeq: number,
    @Param('pp_seq', ParseIntPipe) ppSeq: number,
  ) {
    await this.playerPlaylistsService.removePlayerPlaylist(playerSeq, ppSeq);

    return {
      success: true,
      message: '플레이리스트 할당이 해제되었습니다.',
    };
  }

  // Group Playlist Endpoints
  @Post('player-groups/:group_seq/playlists')
  @ApiOperation({ summary: '그룹에 플레이리스트 할당' })
  @ApiResponse({ status: 201, description: '그룹 플레이리스트 할당 성공' })
  @ApiResponse({ status: 400, description: '유효성 검증 실패 또는 중복 할당' })
  @ApiResponse({ status: 404, description: '그룹 또는 플레이리스트를 찾을 수 없음' })
  async assignPlaylistToGroup(
    @Param('group_seq', ParseIntPipe) groupSeq: number,
    @Body() dto: AssignGroupPlaylistDto,
  ) {
    const data = await this.playerPlaylistsService.assignPlaylistToGroup(groupSeq, dto);

    return {
      success: true,
      message: '그룹에 플레이리스트가 할당되었습니다.',
      data,
    };
  }

  @Put('player-groups/:group_seq/playlists/:gp_seq')
  @ApiOperation({ summary: '그룹 플레이리스트 할당 수정' })
  @ApiResponse({ status: 200, description: '할당 수정 성공' })
  @ApiResponse({ status: 404, description: '할당을 찾을 수 없음' })
  async updateGroupPlaylist(
    @Param('group_seq', ParseIntPipe) groupSeq: number,
    @Param('gp_seq', ParseIntPipe) gpSeq: number,
    @Body() dto: UpdateGroupPlaylistDto,
  ) {
    const data = await this.playerPlaylistsService.updateGroupPlaylist(groupSeq, gpSeq, dto);

    return {
      success: true,
      message: '그룹 플레이리스트 할당이 수정되었습니다.',
      data,
    };
  }

  @Delete('player-groups/:group_seq/playlists/:gp_seq')
  @ApiOperation({ summary: '그룹 플레이리스트 할당 해제' })
  @ApiResponse({ status: 200, description: '할당 해제 성공' })
  @ApiResponse({ status: 404, description: '할당을 찾을 수 없음' })
  async removeGroupPlaylist(
    @Param('group_seq', ParseIntPipe) groupSeq: number,
    @Param('gp_seq', ParseIntPipe) gpSeq: number,
  ) {
    await this.playerPlaylistsService.removeGroupPlaylist(groupSeq, gpSeq);

    return {
      success: true,
      message: '그룹 플레이리스트 할당이 해제되었습니다.',
    };
  }
}
