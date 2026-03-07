import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFtpConfigDto {
  @ApiProperty({ description: '설정명' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  ftpName: string;

  @ApiProperty({ description: 'FTP 호스트' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  ftpHost: string;

  @ApiPropertyOptional({ description: 'FTP 포트', default: 21 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  ftpPort?: number;

  @ApiProperty({ description: 'FTP 계정' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  ftpUsername: string;

  @ApiProperty({ description: 'FTP 비밀번호' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  ftpPassword: string;

  @ApiPropertyOptional({ description: '업로드 기본 경로', default: '/' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ftpPath?: string;

  @ApiPropertyOptional({ description: '프로토콜', default: 'FTP' })
  @IsOptional()
  @IsIn(['FTP', 'SFTP', 'FTPS'])
  ftpProtocol?: 'FTP' | 'SFTP' | 'FTPS';

  @ApiPropertyOptional({ description: '패시브 모드', default: 'Y' })
  @IsOptional()
  @IsIn(['Y', 'N'])
  ftpPassiveMode?: 'Y' | 'N';

  @ApiPropertyOptional({ description: '기본 설정 여부', default: 'N' })
  @IsOptional()
  @IsIn(['Y', 'N'])
  isDefault?: 'Y' | 'N';

  @ApiPropertyOptional({ description: '녹화기 시퀀스 (null이면 글로벌)' })
  @IsOptional()
  @IsNumber()
  recorderSeq?: number | null;
}
