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
import { SocketCommandService } from './socket-command.service';
import { CreateSocketCommandDto } from './dto/create-socket-command.dto';
import { UpdateSocketCommandDto } from './dto/update-socket-command.dto';

@Controller('controller/socket-commands')
export class SocketCommandController {
  constructor(private readonly commandService: SocketCommandService) {}

  @Get()
  findAll() {
    return this.commandService.findAll();
  }

  @Post()
  create(@Body() dto: CreateSocketCommandDto) {
    return this.commandService.create(dto);
  }

  @Put(':seq')
  update(
    @Param('seq', ParseIntPipe) seq: number,
    @Body() dto: UpdateSocketCommandDto,
  ) {
    return this.commandService.update(seq, dto);
  }

  @Delete(':seq')
  remove(@Param('seq', ParseIntPipe) seq: number) {
    return this.commandService.remove(seq);
  }
}
