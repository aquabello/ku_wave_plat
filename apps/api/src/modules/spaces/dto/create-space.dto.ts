import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, MaxLength, Min } from 'class-validator';

export class CreateSpaceDto {
  @ApiProperty({ description: '공간명', example: '101호' })
  @IsNotEmpty({ message: '공간명은 필수입니다' })
  @IsString()
  @MaxLength(100)
  spaceName: string;

  @ApiPropertyOptional({ description: '층 (예: 1, 2, B1, B2)', example: '1' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  spaceFloor?: string;

  @ApiPropertyOptional({ description: '공간 유형 (강의실, 실험실, 사무실, 회의실, 기타)', example: '강의실' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  spaceType?: string;

  @ApiPropertyOptional({ description: '수용 인원', example: 40 })
  @IsOptional()
  @IsInt()
  @Min(0)
  spaceCapacity?: number;

  @ApiPropertyOptional({ description: '공간 설명/메모', example: '프로젝터 설치 완료' })
  @IsOptional()
  @IsString()
  spaceDescription?: string;

  @ApiPropertyOptional({ description: '정렬 순서', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  spaceOrder?: number;
}
