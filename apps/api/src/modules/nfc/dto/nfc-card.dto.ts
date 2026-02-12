import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsString,
  IsIn,
  IsArray,
  ArrayMinSize,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNfcCardDto {
  @ApiProperty({ description: '사용자 일련번호', example: 1 })
  @IsNotEmpty({ message: '사용자 일련번호는 필수입니다' })
  @IsInt({ message: '사용자 일련번호는 정수여야 합니다' })
  @Type(() => Number)
  tuSeq: number;

  @ApiProperty({
    description: '카드 고유 식별값 (UID)',
    example: '04A1B2C3D4E5F6',
  })
  @IsNotEmpty({ message: '카드 식별값은 필수입니다' })
  @IsString()
  cardIdentifier: string;

  @ApiPropertyOptional({
    description: 'Application Identifier (HEX)',
    example: 'D4100000030001',
  })
  @IsOptional()
  @IsString()
  cardAid?: string;

  @ApiPropertyOptional({
    description: '카드 라벨 (사용자 지정)',
    example: '내 회사 출입카드',
  })
  @IsOptional()
  @IsString()
  cardLabel?: string;

  @ApiPropertyOptional({
    description: '카드 유형',
    enum: ['CARD', 'PHONE'],
    example: 'CARD',
  })
  @IsOptional()
  @IsIn(['CARD', 'PHONE'], {
    message: '카드 유형은 CARD 또는 PHONE이어야 합니다',
  })
  cardType?: 'CARD' | 'PHONE';

  @ApiPropertyOptional({
    description: '승인 요청 건물 일련번호 배열 (승인 워크플로우용)',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 이상의 건물을 선택해야 합니다' })
  @IsInt({ each: true, message: '각 건물 일련번호는 정수여야 합니다' })
  @Type(() => Number)
  buildingSeqs?: number[];
}

export class UpdateNfcCardDto {
  @ApiPropertyOptional({ description: '사용자 일련번호', example: 1 })
  @IsOptional()
  @IsInt({ message: '사용자 일련번호는 정수여야 합니다' })
  @Type(() => Number)
  tuSeq?: number;

  @ApiPropertyOptional({
    description: 'Application Identifier (HEX)',
    example: 'D4100000030001',
  })
  @IsOptional()
  @IsString()
  cardAid?: string;

  @ApiPropertyOptional({
    description: '카드 라벨 (사용자 지정)',
    example: '내 회사 출입카드',
  })
  @IsOptional()
  @IsString()
  cardLabel?: string;

  @ApiPropertyOptional({
    description: '카드 유형',
    enum: ['CARD', 'PHONE'],
    example: 'CARD',
  })
  @IsOptional()
  @IsIn(['CARD', 'PHONE'], {
    message: '카드 유형은 CARD 또는 PHONE이어야 합니다',
  })
  cardType?: 'CARD' | 'PHONE';

  @ApiPropertyOptional({
    description: '카드 상태',
    enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'], {
    message: '카드 상태는 ACTIVE, INACTIVE 또는 BLOCKED여야 합니다',
  })
  cardStatus?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export class NfcCardQueryDto {
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
    description: '검색어 (카드 식별값, 라벨, 사용자명)',
    example: '04A1',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'AID 필터 (Application Identifier)',
    example: 'D4100000030001',
  })
  @IsOptional()
  @IsString()
  aid?: string;

  @ApiPropertyOptional({
    description: '카드 유형 필터',
    enum: ['CARD', 'PHONE'],
    example: 'CARD',
  })
  @IsOptional()
  @IsIn(['CARD', 'PHONE'])
  type?: 'CARD' | 'PHONE';

  @ApiPropertyOptional({
    description: '카드 상태 필터',
    enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export class NfcUnregisteredQueryDto {
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
}
