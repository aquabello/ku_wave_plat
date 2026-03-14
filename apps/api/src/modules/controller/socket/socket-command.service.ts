import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbSocketCommand } from './entities/tb-socket-command.entity';
import { CreateSocketCommandDto } from './dto/create-socket-command.dto';
import { UpdateSocketCommandDto } from './dto/update-socket-command.dto';

@Injectable()
export class SocketCommandService {
  constructor(
    @InjectRepository(TbSocketCommand)
    private readonly repository: Repository<TbSocketCommand>,
  ) {}

  async findAll(): Promise<TbSocketCommand[]> {
    return this.repository.find({
      where: { cmdIsdel: 'N' },
      order: { cmdCategory: 'ASC', cmdOrder: 'ASC' },
    });
  }

  async findOne(seq: number): Promise<TbSocketCommand> {
    const command = await this.repository.findOne({
      where: { socketCmdSeq: seq, cmdIsdel: 'N' },
    });
    if (!command) {
      throw new NotFoundException(`Socket command ${seq} not found`);
    }
    return command;
  }

  async create(dto: CreateSocketCommandDto): Promise<TbSocketCommand> {
    const entity = this.repository.create(dto);
    return this.repository.save(entity);
  }

  async update(
    seq: number,
    dto: UpdateSocketCommandDto,
  ): Promise<TbSocketCommand> {
    const command = await this.findOne(seq);
    Object.assign(command, dto);
    return this.repository.save(command);
  }

  async remove(seq: number): Promise<void> {
    const command = await this.findOne(seq);
    command.cmdIsdel = 'Y';
    await this.repository.save(command);
  }
}
