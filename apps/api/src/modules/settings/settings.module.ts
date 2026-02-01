import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { TbSetting } from './entities/tb-setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TbSetting]),
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
