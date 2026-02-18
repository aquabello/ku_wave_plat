import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, IsArray, ArrayMinSize } from 'class-validator';

export class CreatePlayerGroupDto {
  @ApiProperty({ example: '본관 1층 그룹', description: '그룹명' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  group_name: string;

  @ApiProperty({ example: 'GROUP-001', description: '그룹 코드 (UNIQUE)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  group_code: string;

  @ApiProperty({ example: 1, description: '건물 시퀀스', required: false })
  @IsOptional()
  @IsInt()
  building_seq?: number;

  @ApiProperty({ example: '1층 로비 및 복도 디스플레이', description: '그룹 설명', required: false })
  @IsOptional()
  @IsString()
  group_description?: string;

  @ApiProperty({ example: [1, 2, 3], description: '초기 멤버 플레이어 시퀀스 배열', required: false })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  member_player_seqs?: number[];
}
