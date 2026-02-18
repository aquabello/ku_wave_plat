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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { ListPlaylistsDto } from './dto/list-playlists.dto';

@ApiTags('Playlists')
@ApiBearerAuth()
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  @ApiOperation({ summary: '플레이리스트 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findAll(@Query() query: ListPlaylistsDto) {
    const result = await this.playlistsService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':playlist_seq')
  @ApiOperation({ summary: '플레이리스트 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '플레이리스트를 찾을 수 없습니다.' })
  async findOne(@Param('playlist_seq', ParseIntPipe) playlistSeq: number) {
    const result = await this.playlistsService.findOne(playlistSeq);
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  @ApiOperation({ summary: '플레이리스트 등록' })
  @ApiResponse({ status: 201, description: '등록 성공' })
  @ApiResponse({ status: 400, description: '유효성 검증 실패' })
  @ApiResponse({ status: 404, description: '콘텐츠를 찾을 수 없습니다.' })
  @ApiResponse({ status: 409, description: '중복된 플레이리스트 코드' })
  async create(@Body() createPlaylistDto: CreatePlaylistDto) {
    const result = await this.playlistsService.create(createPlaylistDto);
    return {
      success: true,
      message: '플레이리스트가 등록되었습니다.',
      data: result,
    };
  }

  @Put(':playlist_seq')
  @ApiOperation({ summary: '플레이리스트 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '플레이리스트를 찾을 수 없습니다.' })
  async update(
    @Param('playlist_seq', ParseIntPipe) playlistSeq: number,
    @Body() updatePlaylistDto: UpdatePlaylistDto,
  ) {
    const result = await this.playlistsService.update(playlistSeq, updatePlaylistDto);
    return {
      success: true,
      message: '플레이리스트가 수정되었습니다.',
      data: result,
    };
  }

  @Delete(':playlist_seq')
  @ApiOperation({ summary: '플레이리스트 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '플레이리스트를 찾을 수 없습니다.' })
  async remove(@Param('playlist_seq', ParseIntPipe) playlistSeq: number) {
    await this.playlistsService.remove(playlistSeq);
    return {
      success: true,
      message: '플레이리스트가 삭제되었습니다.',
    };
  }
}
