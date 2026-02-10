import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, MaxLength, Min } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ description: '공간 시퀀스', example: 1 })
  @IsNotEmpty({ message: '공간 시퀀스는 필수입니다' })
  @IsInt()
  spaceSeq: number;

  @ApiProperty({ description: '프리셋 시퀀스', example: 1 })
  @IsNotEmpty({ message: '프리셋 시퀀스는 필수입니다' })
  @IsInt()
  presetSeq: number;

  @ApiProperty({ description: '장비명', example: '101호 프로젝터' })
  @IsNotEmpty({ message: '장비명은 필수입니다' })
  @IsString()
  @MaxLength(100)
  deviceName: string;

  @ApiProperty({ description: '장비 IP', example: '192.168.1.101' })
  @IsNotEmpty({ message: '장비 IP는 필수입니다' })
  @IsString()
  @MaxLength(45)
  deviceIp: string;

  @ApiProperty({ description: '장비 포트 (프리셋 defaultPort에서 자동 채움, 수정 가능)', example: 4001 })
  @IsNotEmpty({ message: '장비 포트는 필수입니다' })
  @IsInt()
  @Min(1)
  devicePort: number;

  @ApiPropertyOptional({ description: '정렬 순서', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  deviceOrder?: number;
}
