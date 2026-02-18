import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsString,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNfcReaderDto {
  @ApiProperty({ description: '공간 일련번호', example: 1 })
  @IsNotEmpty({ message: '공간 일련번호는 필수입니다' })
  @IsInt({ message: '공간 일련번호는 정수여야 합니다' })
  @Type(() => Number)
  spaceSeq: number;

  @ApiProperty({ description: '리더기 이름', example: 'NFC 리더기 A동 101호' })
  @IsNotEmpty({ message: '리더기 이름은 필수입니다' })
  @IsString()
  readerName: string;

  @ApiPropertyOptional({
    description: '리더기 시리얼 번호',
    example: 'NFC-2024-001',
  })
  @IsOptional()
  @IsString()
  readerSerial?: string;
}

export class UpdateNfcReaderDto {
  @ApiPropertyOptional({ description: '공간 일련번호', example: 1 })
  @IsOptional()
  @IsInt({ message: '공간 일련번호는 정수여야 합니다' })
  @Type(() => Number)
  spaceSeq?: number;

  @ApiPropertyOptional({
    description: '리더기 이름',
    example: 'NFC 리더기 A동 101호',
  })
  @IsOptional()
  @IsString()
  readerName?: string;

  @ApiPropertyOptional({
    description: '리더기 시리얼 번호',
    example: 'NFC-2024-001',
  })
  @IsOptional()
  @IsString()
  readerSerial?: string;

  @ApiPropertyOptional({
    description: '리더기 상태',
    enum: ['ACTIVE', 'INACTIVE'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'], {
    message: '리더기 상태는 ACTIVE 또는 INACTIVE여야 합니다',
  })
  readerStatus?: 'ACTIVE' | 'INACTIVE';
}

export class NfcReaderQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호 (1부터 시작)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: '검색어 (리더기명, 코드, 시리얼번호)',
    example: 'A동',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '건물 일련번호 필터', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  buildingSeq?: number;

  @ApiPropertyOptional({ description: '공간 일련번호 필터', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  spaceSeq?: number;

  @ApiPropertyOptional({
    description: '리더기 상태 필터',
    enum: ['ACTIVE', 'INACTIVE'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}
