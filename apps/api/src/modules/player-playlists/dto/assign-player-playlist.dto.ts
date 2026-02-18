import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsEnum, IsString, Matches } from 'class-validator';

export class AssignPlayerPlaylistDto {
  @ApiProperty({ example: 1, description: '플레이리스트 시퀀스' })
  @IsInt()
  @IsNotEmpty()
  playlist_seq: number;

  @ApiProperty({ example: 10, description: '우선순위 (0-99)', required: false })
  @IsOptional()
  @IsInt()
  pp_priority?: number;

  @ApiProperty({ example: '09:00:00', description: '시작 시간 (HH:mm:ss)', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'schedule_start_time must be in HH:mm:ss format',
  })
  schedule_start_time?: string;

  @ApiProperty({ example: '18:00:00', description: '종료 시간 (HH:mm:ss)', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'schedule_end_time must be in HH:mm:ss format',
  })
  schedule_end_time?: string;

  @ApiProperty({ example: '1,2,3,4,5', description: '요일 (1=월, 7=일)', required: false })
  @IsOptional()
  @IsString()
  schedule_days?: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'], required: false })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  pp_status?: 'ACTIVE' | 'INACTIVE';
}
