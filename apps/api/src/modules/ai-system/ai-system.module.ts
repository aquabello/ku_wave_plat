import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { TbAiLectureSummary } from './entities/tb-ai-lecture-summary.entity';
import { TbAiSpeechSession } from './entities/tb-ai-speech-session.entity';
import { TbAiSpeechLog } from './entities/tb-ai-speech-log.entity';
import { TbAiCommandLog } from './entities/tb-ai-command-log.entity';
import { TbAiVoiceCommand } from './entities/tb-ai-voice-command.entity';
import { TbAiWorkerServer } from './entities/tb-ai-worker-server.entity';

// Services
import { LectureSummariesService } from './lecture-summaries.service';
import { SpeechSessionsService } from './speech-sessions.service';
import { VoiceCommandsService } from './voice-commands.service';
import { WorkerServersService } from './worker-servers.service';
import { AiCallbackService } from './ai-callback.service';

// Controllers
import { LectureSummariesController } from './lecture-summaries.controller';
import { SpeechSessionsController } from './speech-sessions.controller';
import { VoiceCommandsController } from './voice-commands.controller';
import { WorkerServersController } from './worker-servers.controller';
import { AiCallbackController } from './ai-callback.controller';

// Guards
import { CallbackGuard } from './guards/callback.guard';
import { AiPcApiKeyGuard } from './guards/ai-pc-api-key.guard';

// External modules
import { ControlModule } from '@modules/controller/control/control.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TbAiLectureSummary,
      TbAiSpeechSession,
      TbAiSpeechLog,
      TbAiCommandLog,
      TbAiVoiceCommand,
      TbAiWorkerServer,
    ]),
    ControlModule,
  ],
  controllers: [
    LectureSummariesController,
    SpeechSessionsController,
    VoiceCommandsController,
    WorkerServersController,
    AiCallbackController,
  ],
  providers: [
    LectureSummariesService,
    SpeechSessionsService,
    VoiceCommandsService,
    WorkerServersService,
    AiCallbackService,
    CallbackGuard,
    AiPcApiKeyGuard,
  ],
})
export class AiSystemModule {}
