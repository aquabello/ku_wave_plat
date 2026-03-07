import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkerServersService } from './worker-servers.service';
import { CreateWorkerServerDto } from './dto/create-worker-server.dto';
import { UpdateWorkerServerDto } from './dto/update-worker-server.dto';

@ApiTags('AI System - Worker 서버')
@ApiBearerAuth()
@Controller('ai-system/worker-servers')
export class WorkerServersController {
  constructor(private readonly service: WorkerServersService) {}

  @Get()
  @ApiOperation({ summary: 'Worker 서버 목록 조회' })
  list() {
    return this.service.list();
  }

  @Post()
  @ApiOperation({ summary: 'Worker 서버 등록' })
  create(@Body() dto: CreateWorkerServerDto) {
    return this.service.create(dto);
  }

  @Put(':workerServerSeq')
  @ApiOperation({ summary: 'Worker 서버 수정' })
  update(
    @Param('workerServerSeq', ParseIntPipe) workerServerSeq: number,
    @Body() dto: UpdateWorkerServerDto,
  ) {
    return this.service.update(workerServerSeq, dto);
  }

  @Delete(':workerServerSeq')
  @ApiOperation({ summary: 'Worker 서버 삭제' })
  remove(@Param('workerServerSeq', ParseIntPipe) workerServerSeq: number) {
    return this.service.remove(workerServerSeq);
  }

  @Get(':workerServerSeq/health')
  @ApiOperation({ summary: 'Worker 서버 헬스체크 (Proxy)' })
  health(@Param('workerServerSeq', ParseIntPipe) workerServerSeq: number) {
    return this.service.health(workerServerSeq);
  }
}
