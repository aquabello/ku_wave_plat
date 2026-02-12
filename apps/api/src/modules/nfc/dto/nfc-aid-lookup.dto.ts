import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class NfcAidLookupDto {
  @ApiProperty({
    description: 'AID (Application Identifier) to lookup',
    example: 'D4100000030001',
  })
  @IsNotEmpty({ message: 'AID는 필수입니다' })
  @IsString()
  aid: string;
}
