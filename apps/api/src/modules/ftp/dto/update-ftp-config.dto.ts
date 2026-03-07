import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFtpConfigDto {
  @ApiPropertyOptional({ description: '설정명' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ftpName?: string;

  @ApiPropertyOptional({ description: 'FTP 호스트' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ftpHost?: string;

  @ApiPropertyOptional({ description: 'FTP 포트' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  ftpPort?: number;

  @ApiPropertyOptional({ description: 'FTP 계정' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ftpUsername?: string;

  @ApiPropertyOptional({ description: 'FTP 비밀번호 (빈 값이면 기존 유지)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ftpPassword?: string;

  @ApiPropertyOptional({ description: '업로드 기본 경로' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ftpPath?: string;

  @ApiPropertyOptional({ description: '프로토콜' })
  @IsOptional()
  @IsIn(['FTP', 'SFTP', 'FTPS'])
  ftpProtocol?: 'FTP' | 'SFTP' | 'FTPS';

  @ApiPropertyOptional({ description: '패시브 모드' })
  @IsOptional()
  @IsIn(['Y', 'N'])
  ftpPassiveMode?: 'Y' | 'N';

  @ApiPropertyOptional({ description: '기본 설정 여부' })
  @IsOptional()
  @IsIn(['Y', 'N'])
  isDefault?: 'Y' | 'N';

  @ApiPropertyOptional({ description: '녹화기 시퀀스' })
  @IsOptional()
  @IsNumber()
  recorderSeq?: number | null;
}
