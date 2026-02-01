import {
  IsString,
  IsOptional,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty({ description: 'API 실행 시간 (분)', example: '05' })
  @IsNotEmpty({ message: 'API 실행 시간은 필수 항목입니다' })
  @IsString()
  apiTime: string;

  @ApiProperty({ description: '플레이어 실행 주기 (분)', example: '01' })
  @IsNotEmpty({ message: '플레이어 실행 주기는 필수 항목입니다' })
  @IsString()
  playerTime: string;

  @ApiProperty({ description: '스크린 세이버 시작 (HH:mm)', example: '08:00' })
  @IsNotEmpty({ message: '스크린 세이버 시작 시간은 필수 항목입니다' })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: '스크린 세이버 시작은 HH:mm 형식이어야 합니다',
  })
  screenStart: string;

  @ApiProperty({ description: '스크린 세이버 종료 (HH:mm)', example: '20:00' })
  @IsNotEmpty({ message: '스크린 세이버 종료 시간은 필수 항목입니다' })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: '스크린 세이버 종료는 HH:mm 형식이어야 합니다',
  })
  screenEnd: string;

  @ApiPropertyOptional({ description: '플레이어 버전', example: '1.0.0' })
  @IsOptional()
  @IsString()
  playerVer?: string;

  @ApiPropertyOptional({ description: '플레이어 다운로드 링크', example: 'KUDIDPlayer.exe' })
  @IsOptional()
  @IsString()
  playerLink?: string;

  @ApiPropertyOptional({ description: '와처 버전', example: '1.0.0' })
  @IsOptional()
  @IsString()
  watcherVer?: string;

  @ApiPropertyOptional({ description: '와처 다운로드 링크', example: 'konkuk_did_watcher.exe' })
  @IsOptional()
  @IsString()
  watcherLink?: string;

  @ApiPropertyOptional({ description: '공지사항 링크', example: 'campus_map.jpg' })
  @IsOptional()
  @IsString()
  noticeLink?: string;

  @ApiPropertyOptional({ description: '인트로 링크', example: 'intro.png' })
  @IsOptional()
  @IsString()
  introLink?: string;

  @ApiPropertyOptional({ description: 'DID 플레이어 기본 이미지', example: '1.png' })
  @IsOptional()
  @IsString()
  defaultImage?: string;
}
