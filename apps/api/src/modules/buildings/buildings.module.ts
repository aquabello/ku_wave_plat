import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuildingsController } from './buildings.controller';
import { BuildingsService } from './buildings.service';
import { TbBuilding } from './entities/tb-building.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TbBuilding])],
  controllers: [BuildingsController],
  providers: [BuildingsService],
  exports: [BuildingsService],
})
export class BuildingsModule {}
