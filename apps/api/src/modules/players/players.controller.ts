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
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { ListPlayersDto } from './dto/list-players.dto';
import { RejectPlayerDto } from './dto/reject-player.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { ListHeartbeatLogsDto } from './dto/list-heartbeat-logs.dto';
import { PlayerApiKeyGuard } from './guards/player-api-key.guard';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('Players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이어 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findAll(@Query() query: ListPlayersDto) {
    const result = await this.playersService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':player_seq')
  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이어 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '플레이어를 찾을 수 없습니다.' })
  async findOne(@Param('player_seq', ParseIntPipe) playerSeq: number) {
    const result = await this.playersService.findOne(playerSeq);
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이어 등록' })
  @ApiResponse({ status: 201, description: '등록 성공' })
  @ApiResponse({ status: 400, description: '유효성 검증 실패' })
  @ApiResponse({ status: 404, description: '건물/공간을 찾을 수 없습니다.' })
  @ApiResponse({ status: 409, description: '중복된 플레이어 코드/Device ID' })
  async create(@Body() createPlayerDto: CreatePlayerDto) {
    const result = await this.playersService.create(createPlayerDto);
    return {
      success: true,
      message: '플레이어가 등록되었습니다. 관리자 승인 대기 중입니다.',
      data: result,
    };
  }

  @Put(':player_seq')
  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이어 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '플레이어를 찾을 수 없습니다.' })
  async update(
    @Param('player_seq', ParseIntPipe) playerSeq: number,
    @Body() updatePlayerDto: UpdatePlayerDto,
  ) {
    const result = await this.playersService.update(playerSeq, updatePlayerDto);
    return {
      success: true,
      message: '플레이어 정보가 수정되었습니다.',
      data: result,
    };
  }

  @Delete(':player_seq')
  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이어 삭제 (소프트 삭제)' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '플레이어를 찾을 수 없습니다.' })
  async remove(@Param('player_seq', ParseIntPipe) playerSeq: number) {
    await this.playersService.remove(playerSeq);
    return {
      success: true,
      message: '플레이어가 삭제되었습니다.',
    };
  }

  @Post(':player_seq/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이어 승인' })
  @ApiResponse({ status: 200, description: '승인 성공' })
  @ApiResponse({ status: 404, description: '플레이어를 찾을 수 없습니다.' })
  @ApiResponse({ status: 400, description: '이미 승인된 플레이어입니다.' })
  async approve(@Param('player_seq', ParseIntPipe) playerSeq: number, @Req() req: any) {
    const userId = req.user?.seq || 1; // JWT payload에서 사용자 ID 추출
    const result = await this.playersService.approve(playerSeq, userId);
    return {
      success: true,
      message: '플레이어가 승인되었습니다.',
      data: result,
    };
  }

  @Post(':player_seq/reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이어 반려' })
  @ApiResponse({ status: 200, description: '반려 성공' })
  @ApiResponse({ status: 404, description: '플레이어를 찾을 수 없습니다.' })
  async reject(
    @Param('player_seq', ParseIntPipe) playerSeq: number,
    @Body() rejectDto: RejectPlayerDto,
    @Req() req: any,
  ) {
    const userId = req.user?.seq || 1;
    const result = await this.playersService.reject(playerSeq, rejectDto, userId);
    return {
      success: true,
      message: '플레이어가 반려되었습니다.',
      data: result,
    };
  }

  @Post('heartbeat')
  @Public()
  @UseGuards(PlayerApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Health Check 전송 (플레이어 → 서버)' })
  @ApiResponse({ status: 200, description: 'Heartbeat received' })
  @ApiResponse({ status: 401, description: '유효하지 않은 API Key' })
  async heartbeat(@Body() heartbeatDto: HeartbeatDto, @Ip() ip: string) {
    const result = await this.playersService.heartbeat(heartbeatDto, ip);
    return {
      success: true,
      message: 'Heartbeat received',
      data: result,
    };
  }

  @Get(':player_seq/heartbeat-logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Health Check 로그 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '플레이어를 찾을 수 없습니다.' })
  async findHeartbeatLogs(
    @Param('player_seq', ParseIntPipe) playerSeq: number,
    @Query() query: ListHeartbeatLogsDto,
  ) {
    const result = await this.playersService.findHeartbeatLogs(playerSeq, query);
    return {
      success: true,
      data: result,
    };
  }
}
