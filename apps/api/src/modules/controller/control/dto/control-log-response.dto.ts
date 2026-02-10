import { ApiProperty } from '@nestjs/swagger';

export class ControlLogItemDto {
  @ApiProperty({ description: '번호 (역순)', example: 100 })
  no: number;

  @ApiProperty({ description: '로그 시퀀스', example: 1 })
  logSeq: number;

  @ApiProperty({ description: '공간명', example: '101호' })
  spaceName: string;

  @ApiProperty({ description: '장비명', example: '101호 프로젝터' })
  deviceName: string;

  @ApiProperty({ description: '명령어명', example: '전원 ON' })
  commandName: string;

  @ApiProperty({ description: '명령어 유형', example: 'POWER_ON' })
  commandType: string;

  @ApiProperty({ description: '실행자 이름', example: '관리자' })
  executedBy: string;

  @ApiProperty({ description: '결과 (SUCCESS/FAIL/TIMEOUT)', example: 'SUCCESS' })
  resultStatus: string;

  @ApiProperty({ description: '응답/에러 메시지', example: '명령어 전송 완료', nullable: true })
  resultMessage: string | null;

  @ApiProperty({ description: '실행 시각', example: '2026-02-09T10:30:00.000Z' })
  executedAt: string;
}

export class ControlLogResponseDto {
  @ApiProperty({ type: [ControlLogItemDto] })
  items: ControlLogItemDto[];

  @ApiProperty({ description: '전체 로그 수', example: 100 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;
}
