import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TbNfcReader } from './entities/tb-nfc-reader.entity';
import { TbNfcCard } from './entities/tb-nfc-card.entity';
import { TbNfcLog } from './entities/tb-nfc-log.entity';
import { TbNfcReaderCommand } from './entities/tb-nfc-reader-command.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbUserBuilding } from '@modules/permissions/entities/tb-user-building.entity';
import { TbSpaceDevice } from '@modules/controller/devices/entities/tb-space-device.entity';
import { TbPresetCommand } from '@modules/controller/presets/entities/tb-preset-command.entity';
import { ControlModule } from '@modules/controller/control/control.module';
import { NfcController } from './nfc.controller';
import { NfcTagService } from './services/nfc-tag.service';
import { NfcReaderService } from './services/nfc-reader.service';
import { NfcCardService } from './services/nfc-card.service';
import { NfcLogService } from './services/nfc-log.service';
import { NfcStatsService } from './services/nfc-stats.service';
import { NfcReaderCommandService } from './services/nfc-reader-command.service';
import { NfcApiKeyGuard } from './guards/nfc-api-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TbNfcReader,
      TbNfcCard,
      TbNfcLog,
      TbNfcReaderCommand,
      TbSpace,
      TbBuilding,
      TbUser,
      TbUserBuilding,
      TbSpaceDevice,
      TbPresetCommand,
    ]),
    ControlModule, // For ControlService (executeForNfc)
  ],
  controllers: [NfcController],
  providers: [
    NfcTagService,
    NfcReaderService,
    NfcCardService,
    NfcLogService,
    NfcStatsService,
    NfcReaderCommandService,
    NfcApiKeyGuard,
  ],
  exports: [NfcTagService],
})
export class NfcModule {}
