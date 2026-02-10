import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { TbSpace } from './entities/tb-space.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TbSpace, TbBuilding])],
  controllers: [SpacesController],
  providers: [SpacesService],
  exports: [SpacesService],
})
export class SpacesModule {}
