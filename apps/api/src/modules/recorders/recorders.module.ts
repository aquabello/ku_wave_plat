import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { TbRecorder } from './entities/recorder.entity';
import { TbRecorderPreset } from './entities/recorder-preset.entity';
import { TbRecordingSession } from './entities/recording-session.entity';
import { TbRecordingFile } from './entities/recording-file.entity';
import { TbRecorderLog } from './entities/recorder-log.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { RecordersController } from './recorders.controller';
import { RecorderControlController } from './recorder-control.controller';
import { RecordersService } from './recorders.service';
import { RecorderControlService } from './recorder-control.service';
import { RecorderHealthService } from './recorder-health.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TbRecorder,
      TbRecorderPreset,
      TbRecordingSession,
      TbRecordingFile,
      TbRecorderLog,
      TbSpace,
    ]),
    HttpModule.register({ timeout: 10000 }),
  ],
  controllers: [RecordersController, RecorderControlController],
  providers: [RecordersService, RecorderControlService, RecorderHealthService],
  exports: [RecordersService, RecorderControlService],
})
export class RecordersModule {}
