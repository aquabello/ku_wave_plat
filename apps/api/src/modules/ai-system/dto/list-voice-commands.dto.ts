import { IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ListVoiceCommandsDto {
  @ApiPropertyOptional({ description: '공간 시퀀스 필터' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  spaceSeq?: number;

  @ApiPropertyOptional({ description: '키워드 검색' })
  @IsOptional()
  @IsString()
  search?: string;
}
