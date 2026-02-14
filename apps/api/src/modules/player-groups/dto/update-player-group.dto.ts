import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsInt } from 'class-validator';

export class UpdatePlayerGroupDto {
  @ApiProperty({ example: '본관 1층 그룹', description: '그룹명', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  group_name?: string;

  @ApiProperty({ example: 1, description: '건물 시퀀스', required: false })
  @IsOptional()
  @IsInt()
  building_seq?: number;

  @ApiProperty({ example: '그룹 설명 수정', description: '그룹 설명', required: false })
  @IsOptional()
  @IsString()
  group_description?: string;

  @ApiProperty({ example: 10, description: '정렬 순서', required: false })
  @IsOptional()
  @IsInt()
  group_order?: number;
}
