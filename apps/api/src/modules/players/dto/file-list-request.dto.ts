import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FileListRequestDto {
  @ApiPropertyOptional({ description: 'Watcher 버전', example: '1.0.0' })
  @IsOptional()
  @IsString()
  watcher_ver?: string;

  @ApiPropertyOptional({ description: 'Player 버전', example: '1.0.0' })
  @IsOptional()
  @IsString()
  player_ver?: string;
}
