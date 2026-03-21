import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TbRecordingSession } from '@modules/recorders/entities/recording-session.entity';
import { TbRecordingFile } from '@modules/recorders/entities/recording-file.entity';
import { FtpModule } from '@modules/ftp/ftp.module';
import { RecordingsController } from './recordings.controller';
import { RecordingsService } from './recordings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TbRecordingSession, TbRecordingFile]),
    FtpModule,
  ],
  controllers: [RecordingsController],
  providers: [RecordingsService],
  exports: [RecordingsService],
})
export class RecordingsModule {}
