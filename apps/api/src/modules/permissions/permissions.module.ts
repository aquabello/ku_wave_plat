import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbMenuUsers } from '@modules/menus/entities/tb-menu-users.entity';
import { TbMenu } from '@modules/menus/entities/tb-menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TbUser, TbMenuUsers, TbMenu])],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
