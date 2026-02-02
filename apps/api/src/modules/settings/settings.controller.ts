import {
  Controller,
  Get,
  Put,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto, SettingResponseDto } from './dto';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('system')
  @ApiOperation({
    summary: '시스템 설정 조회',
    description: '현재 시스템 설정(tb_setting)을 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '시스템 설정 조회 성공',
    type: SettingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '설정 데이터 없음',
  })
  async getSystemSettings(): Promise<SettingResponseDto> {
    return await this.settingsService.getSystemSettings();
  }

  @Put('system')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '시스템 설정 수정',
    description:
      '시스템 설정을 수정합니다. 이미지 파일을 함께 업로드할 수 있습니다. ' +
      '설정과 이미지는 원자적으로 처리되어 하나라도 실패하면 전체 롤백됩니다.',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        apiTime: { type: 'string', description: 'API 실행 시간 (분)', example: '05' },
        playerTime: { type: 'string', description: '플레이어 실행 주기 (분)', example: '01' },
        screenStart: {
          type: 'string',
          description: '스크린 세이버 시작 (HH:mm)',
          example: '08:00',
        },
        screenEnd: { type: 'string', description: '스크린 세이버 종료 (HH:mm)', example: '20:00' },
        playerVer: { type: 'string', description: '플레이어 버전', example: '1.0.0' },
        playerLink: {
          type: 'string',
          description: '플레이어 다운로드 링크',
          example: 'KUDIDPlayer.exe',
        },
        watcherVer: { type: 'string', description: '와처 버전', example: '1.0.0' },
        watcherLink: {
          type: 'string',
          description: '와처 다운로드 링크',
          example: 'konkuk_did_watcher.exe',
        },
        noticeLink: { type: 'string', description: '공지사항 링크', example: 'campus_map.jpg' },
        introLink: { type: 'string', description: '인트로 링크', example: 'intro.png' },
        defaultImage: { type: 'string', description: '기본 이미지 경로', nullable: true },
        file: {
          type: 'string',
          format: 'binary',
          description: 'DID 기본 이미지 (JPEG/PNG, 최대 5MB, 선택)',
        },
      },
      required: ['apiTime', 'playerTime', 'screenStart', 'screenEnd'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '시스템 설정 수정 성공',
    type: SettingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '유효성 검증 실패 또는 파일 오류',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '서버 오류 (전체 롤백됨)',
  })
  async updateSystemSettings(
    @Body() updateDto: UpdateSettingDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SettingResponseDto> {
    return await this.settingsService.updateSystemSettings(updateDto, file);
  }
}
