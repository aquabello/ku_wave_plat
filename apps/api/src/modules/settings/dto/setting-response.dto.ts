import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SettingResponseDto {
  @ApiProperty({ description: '시퀀스', example: 1 })
  seq: number;

  @ApiProperty({ description: 'API 실행 시간 (분)', example: '05' })
  apiTime: string | null;

  @ApiProperty({ description: '플레이어 실행 주기 (분)', example: '01' })
  playerTime: string | null;

  @ApiProperty({ description: '스크린 세이버 시작 (HH:mm)', example: '08:00' })
  screenStart: string | null;

  @ApiProperty({ description: '스크린 세이버 종료 (HH:mm)', example: '20:00' })
  screenEnd: string | null;

  @ApiPropertyOptional({ description: '플레이어 버전', example: '1.0.0' })
  playerVer: string | null;

  @ApiPropertyOptional({ description: '플레이어 다운로드 링크', example: 'KUDIDPlayer.exe' })
  playerLink: string | null;

  @ApiPropertyOptional({ description: '와처 버전', example: '1.0.0' })
  watcherVer: string | null;

  @ApiPropertyOptional({ description: '와처 다운로드 링크', example: 'konkuk_did_watcher.exe' })
  watcherLink: string | null;

  @ApiPropertyOptional({ description: '공지사항 링크', example: 'campus_map.jpg' })
  noticeLink: string | null;

  @ApiPropertyOptional({ description: '인트로 링크', example: 'intro.png' })
  introLink: string | null;

  @ApiPropertyOptional({ description: 'DID 플레이어 기본 이미지 경로', example: '1.png' })
  defaultImage: string | null;

  @ApiProperty({ description: '등록일', example: '2024-01-01T00:00:00.000Z' })
  regDate: Date;
}
