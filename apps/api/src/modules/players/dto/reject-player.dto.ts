import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectPlayerDto {
  @ApiProperty({ description: '반려 사유', example: '설치 위치가 부적절합니다.' })
  @IsString()
  @IsNotEmpty()
  reject_reason: string;
}
