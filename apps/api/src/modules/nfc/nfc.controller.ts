import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { NfcApiKeyGuard } from './guards/nfc-api-key.guard';
import {
  NfcTagDto,
  CreateNfcReaderDto,
  UpdateNfcReaderDto,
  NfcReaderQueryDto,
  CreateNfcCardDto,
  UpdateNfcCardDto,
  NfcCardQueryDto,
  NfcUnregisteredQueryDto,
  NfcLogQueryDto,
  NfcAidLookupDto,
  UpdateReaderCommandsDto,
} from './dto';
import { NfcTagService } from './services/nfc-tag.service';
import { NfcReaderService } from './services/nfc-reader.service';
import { NfcCardService } from './services/nfc-card.service';
import { NfcLogService } from './services/nfc-log.service';
import { NfcStatsService } from './services/nfc-stats.service';
import { NfcReaderCommandService } from './services/nfc-reader-command.service';

@ApiTags('NFC')
@Controller('nfc')
export class NfcController {
  constructor(
    private readonly nfcTagService: NfcTagService,
    private readonly nfcReaderService: NfcReaderService,
    private readonly nfcCardService: NfcCardService,
    private readonly nfcLogService: NfcLogService,
    private readonly nfcStatsService: NfcStatsService,
    private readonly nfcReaderCommandService: NfcReaderCommandService,
  ) {}

  // ========================================
  // 1. NFC 태깅 처리 (API Key auth)
  // ========================================

  @Public()
  @UseGuards(NfcApiKeyGuard)
  @Post('tag')
  @ApiOperation({ summary: 'NFC 태깅 처리 (Agent → BE)' })
  @ApiResponse({ status: 200, description: '태깅 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 API Key' })
  @ApiResponse({ status: 404, description: '미등록 카드' })
  async tag(@Body() dto: NfcTagDto, @Req() req: any) {
    return this.nfcTagService.processTag(dto, req.nfcReader);
  }

  // ========================================
  // AID 통합 조회 (JWT auth)
  // ========================================

  @Get('aid-lookup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AID 통합 조회 (카드 등록 여부 + 최근 로그)' })
  @ApiResponse({ status: 200, description: 'AID 조회 결과 반환' })
  async aidLookup(@Query() query: NfcAidLookupDto) {
    return this.nfcCardService.lookupByAid(query.aid);
  }

  // ========================================
  // 2-7. NFC 리더기 관리 (JWT auth)
  // ========================================

  @Get('readers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 리더기 목록 조회' })
  @ApiResponse({ status: 200, description: '리더기 목록 반환' })
  async getReaders(@Query() query: NfcReaderQueryDto) {
    return this.nfcReaderService.findAll(query);
  }

  @Get('readers/:readerSeq')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 리더기 상세 조회' })
  @ApiResponse({ status: 200, description: '리더기 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '리더기를 찾을 수 없음' })
  async getReader(@Param('readerSeq', ParseIntPipe) readerSeq: number) {
    return this.nfcReaderService.findOne(readerSeq);
  }

  @Post('readers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 리더기 등록' })
  @ApiResponse({ status: 201, description: '리더기 등록 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async createReader(@Body() dto: CreateNfcReaderDto) {
    return this.nfcReaderService.create(dto);
  }

  @Put('readers/:readerSeq')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 리더기 수정' })
  @ApiResponse({ status: 200, description: '리더기 수정 성공' })
  @ApiResponse({ status: 404, description: '리더기를 찾을 수 없음' })
  async updateReader(
    @Param('readerSeq', ParseIntPipe) readerSeq: number,
    @Body() dto: UpdateNfcReaderDto,
  ) {
    return this.nfcReaderService.update(readerSeq, dto);
  }

  @Delete('readers/:readerSeq')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 리더기 삭제' })
  @ApiResponse({ status: 200, description: '리더기 삭제 성공' })
  @ApiResponse({ status: 404, description: '리더기를 찾을 수 없음' })
  async deleteReader(@Param('readerSeq', ParseIntPipe) readerSeq: number) {
    await this.nfcReaderService.remove(readerSeq);
    return { message: 'NFC 리더기가 삭제되었습니다' };
  }

  @Post('readers/:readerSeq/regenerate-key')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 리더기 API Key 재발급' })
  @ApiResponse({ status: 200, description: 'API Key 재발급 성공' })
  @ApiResponse({ status: 404, description: '리더기를 찾을 수 없음' })
  async regenerateKey(@Param('readerSeq', ParseIntPipe) readerSeq: number) {
    return this.nfcReaderService.regenerateKey(readerSeq);
  }

  @Get('readers/:readerSeq/commands')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 리더기 명령어 매핑 조회' })
  @ApiResponse({ status: 200, description: '명령어 매핑 목록 반환' })
  @ApiResponse({ status: 404, description: '리더기를 찾을 수 없음' })
  async getReaderCommands(@Param('readerSeq', ParseIntPipe) readerSeq: number) {
    return this.nfcReaderCommandService.getReaderCommands(readerSeq);
  }

  @Put('readers/:readerSeq/commands')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 리더기 명령어 매핑 등록/수정' })
  @ApiResponse({ status: 200, description: '명령어 매핑 저장 성공' })
  @ApiResponse({ status: 404, description: '리더기를 찾을 수 없음' })
  @ApiResponse({ status: 422, description: '유효하지 않은 요청 (장비가 리더기 공간에 속하지 않음)' })
  async updateReaderCommands(
    @Param('readerSeq', ParseIntPipe) readerSeq: number,
    @Body() dto: UpdateReaderCommandsDto,
  ) {
    return this.nfcReaderCommandService.updateReaderCommands(readerSeq, dto);
  }

  // ========================================
  // 8-13. NFC 카드 관리 (JWT auth)
  // ========================================

  // IMPORTANT: /unregistered route MUST be before /:cardSeq to avoid route conflict
  @Get('cards/unregistered')
  @ApiBearerAuth()
  @ApiOperation({ summary: '미등록 태그 목록 조회' })
  @ApiResponse({ status: 200, description: '미등록 태그 목록 반환' })
  async getUnregisteredCards(@Query() query: NfcUnregisteredQueryDto) {
    return this.nfcCardService.findUnregistered(query);
  }

  @Get('cards')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 카드 목록 조회' })
  @ApiResponse({ status: 200, description: '카드 목록 반환' })
  async getCards(@Query() query: NfcCardQueryDto) {
    return this.nfcCardService.findAll(query);
  }

  @Get('cards/:cardSeq')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 카드 상세 조회' })
  @ApiResponse({ status: 200, description: '카드 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '카드를 찾을 수 없음' })
  async getCard(@Param('cardSeq', ParseIntPipe) cardSeq: number) {
    return this.nfcCardService.findOne(cardSeq);
  }

  @Post('cards')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 카드 등록/승인' })
  @ApiResponse({ status: 201, description: '카드 등록 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async createCard(@Body() dto: CreateNfcCardDto) {
    return this.nfcCardService.create(dto);
  }

  @Put('cards/:cardSeq')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 카드 수정' })
  @ApiResponse({ status: 200, description: '카드 수정 성공' })
  @ApiResponse({ status: 404, description: '카드를 찾을 수 없음' })
  async updateCard(
    @Param('cardSeq', ParseIntPipe) cardSeq: number,
    @Body() dto: UpdateNfcCardDto,
  ) {
    return this.nfcCardService.update(cardSeq, dto);
  }

  @Delete('cards/:cardSeq')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 카드 삭제' })
  @ApiResponse({ status: 200, description: '카드 삭제 성공' })
  @ApiResponse({ status: 404, description: '카드를 찾을 수 없음' })
  async deleteCard(@Param('cardSeq', ParseIntPipe) cardSeq: number) {
    await this.nfcCardService.remove(cardSeq);
    return { message: 'NFC 카드가 삭제되었습니다' };
  }

  // ========================================
  // 14-16. 로그 & 통계 (JWT auth)
  // ========================================

  @Get('logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 태깅 로그 목록' })
  @ApiResponse({ status: 200, description: '로그 목록 반환' })
  async getLogs(@Query() query: NfcLogQueryDto) {
    return this.nfcLogService.findAll(query);
  }

  @Get('logs/:nfcLogSeq')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 태깅 로그 상세' })
  @ApiResponse({ status: 200, description: '로그 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '로그를 찾을 수 없음' })
  async getLog(@Param('nfcLogSeq', ParseIntPipe) nfcLogSeq: number) {
    return this.nfcLogService.findOne(nfcLogSeq);
  }

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'NFC 대시보드 통계' })
  @ApiResponse({ status: 200, description: '통계 데이터 반환' })
  async getStats() {
    return this.nfcStatsService.getStats();
  }
}
