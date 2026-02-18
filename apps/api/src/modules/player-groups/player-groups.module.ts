import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerGroupsController } from './player-groups.controller';
import { PlayerGroupsService } from './player-groups.service';
import { TbPlayerGroup } from './entities/tb-player-group.entity';
import { TbPlayerGroupMember } from './entities/tb-player-group-member.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TbPlayerGroup,
      TbPlayerGroupMember,
      TbPlayer,
      TbBuilding,
    ]),
  ],
  controllers: [PlayerGroupsController],
  providers: [PlayerGroupsService],
  exports: [PlayerGroupsService],
})
export class PlayerGroupsModule {}
