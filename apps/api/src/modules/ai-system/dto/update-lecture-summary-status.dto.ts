import { IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProcessStatus } from '../enums/process-status.enum';

export class UpdateLectureSummaryStatusDto {
  @ApiProperty({ description: '처리 상태', enum: ProcessStatus })
  @IsNotEmpty()
  @IsEnum(ProcessStatus)
  processStatus: ProcessStatus;
}
