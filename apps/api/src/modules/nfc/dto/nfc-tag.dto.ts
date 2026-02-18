import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class NfcTagDto {
  @ApiProperty({
    description: '카드 고유 식별값 (UID)',
    example: '04A1B2C3D4E5F6',
  })
  @IsNotEmpty({ message: '식별값은 필수입니다' })
  @IsString()
  identifier: string;

  @ApiPropertyOptional({
    description: 'Application Identifier (HEX)',
    example: 'D4100000030001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32, { message: 'AID는 최대 32자입니다' })
  aid?: string;
}
