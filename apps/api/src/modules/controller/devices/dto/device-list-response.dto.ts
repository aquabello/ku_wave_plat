import { ApiProperty } from '@nestjs/swagger';

export class DeviceListItemDto {
  @ApiProperty({ description: '번호 (역순)', example: 5 })
  no: number;

  @ApiProperty({ description: '공간장비 시퀀스', example: 1 })
  spaceDeviceSeq: number;

  @ApiProperty({ description: '공간 시퀀스', example: 1 })
  spaceSeq: number;

  @ApiProperty({ description: '공간명', example: '101호' })
  spaceName: string;

  @ApiProperty({ description: '층', example: '1' })
  spaceFloor: string | null;

  @ApiProperty({ description: '프리셋 시퀀스', example: 1 })
  presetSeq: number;

  @ApiProperty({ description: '프리셋명', example: '강의실 프로젝터' })
  presetName: string;

  @ApiProperty({ description: '통신 프로토콜', example: 'TCP' })
  protocolType: string;

  @ApiProperty({ description: '장비명', example: '101호 프로젝터' })
  deviceName: string;

  @ApiProperty({ description: '장비 IP', example: '192.168.1.100' })
  deviceIp: string | null;

  @ApiProperty({ description: '장비 포트', example: 9999 })
  devicePort: number | null;

  @ApiProperty({ description: '장비 상태', example: 'ACTIVE' })
  deviceStatus: string | null;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  deviceOrder: number | null;
}

export class DeviceListResponseDto {
  @ApiProperty({ type: [DeviceListItemDto] })
  items: DeviceListItemDto[];

  @ApiProperty({ description: '전체 수', example: 10 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 1 })
  totalPages: number;
}
