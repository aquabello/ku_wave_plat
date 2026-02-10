import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsString, IsIn } from 'class-validator';

export class ExecuteBatchDto {
  @ApiProperty({ description: '공간 시퀀스', example: 1 })
  @IsNotEmpty({ message: '공간 시퀀스는 필수입니다' })
  @IsInt()
  spaceSeq: number;

  @ApiProperty({
    description: '명령어 유형 (POWER_ON / POWER_OFF)',
    example: 'POWER_ON',
    enum: ['POWER_ON', 'POWER_OFF'],
  })
  @IsNotEmpty({ message: '명령어 유형은 필수입니다' })
  @IsString()
  @IsIn(['POWER_ON', 'POWER_OFF'], { message: '명령어 유형은 POWER_ON 또는 POWER_OFF만 가능합니다' })
  commandType: string;
}
