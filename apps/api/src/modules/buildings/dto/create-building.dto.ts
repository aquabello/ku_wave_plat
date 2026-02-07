import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, MaxLength, Min } from 'class-validator';

export class CreateBuildingDto {
  @ApiProperty({ description: '건물명', example: '공학관 A동' })
  @IsNotEmpty({ message: '건물명은 필수입니다' })
  @IsString()
  @MaxLength(100)
  buildingName: string;

  @ApiPropertyOptional({ description: '위치 설명', example: '서울시 광진구 능동로 120' })
  @IsOptional()
  @IsString()
  buildingLocation?: string;

  @ApiPropertyOptional({ description: '층수', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  buildingFloorCount?: number;

  @ApiPropertyOptional({ description: '정렬 순서', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  buildingOrder?: number;

  @ApiPropertyOptional({ description: '건물 담당자', example: '홍길동' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  buildingManagerName?: string;

  @ApiPropertyOptional({ description: '담당자 연락처', example: '010-1234-5678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  buildingManagerPhone?: string;
}
