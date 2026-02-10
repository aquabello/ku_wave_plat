import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControlController } from './control.controller';
import { ControlService } from './control.service';
import { DevicesController } from '@modules/controller/devices/devices.controller';
import { DevicesService } from '@modules/controller/devices/devices.service';
import { TbControlLog } from './entities/tb-control-log.entity';
import { TbSpaceDevice } from '@modules/controller/devices/entities/tb-space-device.entity';
import { TbPresetCommand } from '@modules/controller/presets/entities/tb-preset-command.entity';
import { TbDevicePreset } from '@modules/controller/presets/entities/tb-device-preset.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TbControlLog,
      TbSpaceDevice,
      TbPresetCommand,
      TbDevicePreset,
      TbSpace,
      TbBuilding,
      TbUser,
    ]),
  ],
  controllers: [ControlController, DevicesController],
  providers: [ControlService, DevicesService],
  exports: [ControlService, DevicesService],
})
export class ControlModule {}
