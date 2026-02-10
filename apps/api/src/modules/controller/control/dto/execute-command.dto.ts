import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class ExecuteCommandDto {
  @ApiProperty({ description: '공간장비 시퀀스', example: 1 })
  @IsNotEmpty({ message: '공간장비 시퀀스는 필수입니다' })
  @IsInt()
  spaceDeviceSeq: number;

  @ApiProperty({ description: '명령어 시퀀스', example: 1 })
  @IsNotEmpty({ message: '명령어 시퀀스는 필수입니다' })
  @IsInt()
  commandSeq: number;
}
