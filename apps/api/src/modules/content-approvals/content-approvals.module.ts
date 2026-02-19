import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentApprovalsController } from './content-approvals.controller';
import { ContentApprovalsService } from './content-approvals.service';
import { TbPlayListContent } from '@modules/playlists/entities/tb-play-list-content.entity';
import { TbContentApprovalLog } from './entities/tb-content-approval-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TbPlayListContent,
      TbContentApprovalLog,
    ]),
  ],
  controllers: [ContentApprovalsController],
  providers: [ContentApprovalsService],
  exports: [ContentApprovalsService],
})
export class ContentApprovalsModule {}
