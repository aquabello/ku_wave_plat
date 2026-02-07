import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { TbMenu } from './entities/tb-menu.entity';
import { TbMenuUsers } from './entities/tb-menu-users.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TbMenu, TbMenuUsers, TbUser])],
  controllers: [MenusController],
  providers: [MenusService],
  exports: [MenusService],
})
export class MenusModule {}
