import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TbFtpConfig } from './entities/ftp-config.entity';
import { TbRecordingFile } from '@modules/recorders/entities/recording-file.entity';
import { FtpController } from './ftp.controller';
import { FtpService } from './ftp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TbFtpConfig, TbRecordingFile]),
  ],
  controllers: [FtpController],
  providers: [FtpService],
  exports: [FtpService],
})
export class FtpModule {}
