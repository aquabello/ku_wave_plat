import { ApiProperty } from '@nestjs/swagger';

export class PresetListItemDto {
  @ApiProperty({ description: '번호 (역순)', example: 5 })
  no: number;

  @ApiProperty({ description: '프리셋 시퀀스', example: 1 })
  presetSeq: number;

  @ApiProperty({ description: '프리셋명', example: '강의실 프로젝터' })
  presetName: string;

  @ApiProperty({ description: '통신 프로토콜', example: 'TCP' })
  protocolType: string;

  @ApiProperty({ description: '기본 통신 IP', example: '192.168.0.100' })
  commIp: string | null;

  @ApiProperty({ description: '기본 통신 포트', example: 9000 })
  commPort: number | null;

  @ApiProperty({ description: '프리셋 설명', example: 'Sony 프로젝터 제어용 프리셋' })
  presetDescription: string | null;

  @ApiProperty({ description: '명령어 수', example: 5 })
  commandCount: number;

  @ApiProperty({ description: '연결된 장비 수', example: 3 })
  deviceCount: number;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  presetOrder: number | null;
}

export class PresetListResponseDto {
  @ApiProperty({ type: [PresetListItemDto] })
  items: PresetListItemDto[];

  @ApiProperty({ description: '전체 수', example: 10 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 1 })
  totalPages: number;
}
