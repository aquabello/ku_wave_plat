import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectContentApprovalDto {
  @ApiProperty({ description: '반려 사유', example: '콘텐츠 해상도가 규격에 맞지 않습니다.' })
  @IsString()
  @IsNotEmpty({ message: '반려 사유는 필수입니다.' })
  reason: string;
}
