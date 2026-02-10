import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PresetsController } from './presets.controller';
import { PresetsService } from './presets.service';
import { TbDevicePreset } from './entities/tb-device-preset.entity';
import { TbPresetCommand } from './entities/tb-preset-command.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TbDevicePreset, TbPresetCommand])],
  controllers: [PresetsController],
  providers: [PresetsService],
  exports: [PresetsService],
})
export class PresetsModule {}
