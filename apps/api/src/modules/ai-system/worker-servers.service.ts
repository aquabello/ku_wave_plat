import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbAiWorkerServer } from './entities/tb-ai-worker-server.entity';
import { WorkerServerStatus } from './enums/worker-server-status.enum';
import { CreateWorkerServerDto } from './dto/create-worker-server.dto';
import { UpdateWorkerServerDto } from './dto/update-worker-server.dto';

@Injectable()
export class WorkerServersService {
  private readonly logger = new Logger(WorkerServersService.name);

  constructor(
    @InjectRepository(TbAiWorkerServer)
    private readonly workerServerRepository: Repository<TbAiWorkerServer>,
  ) {}

  async list() {
    const items = await this.workerServerRepository.find({
      where: { serverIsdel: 'N' },
      order: { regDate: 'DESC' },
    });

    return {
      items: items.map((s) => ({
        workerServerSeq: s.workerServerSeq,
        serverName: s.serverName,
        serverUrl: s.serverUrl,
        serverStatus: s.serverStatus,
        lastHealthCheck: s.lastHealthCheck,
        gpuInfo: s.gpuInfo,
        maxConcurrentJobs: s.maxConcurrentJobs,
        defaultSttModel: s.defaultSttModel,
        defaultLlmModel: s.defaultLlmModel,
        regDate: s.regDate,
      })),
    };
  }

  async findOne(workerServerSeq: number) {
    const entity = await this.workerServerRepository.findOne({
      where: { workerServerSeq, serverIsdel: 'N' },
    });
    if (!entity) {
      throw new NotFoundException('Worker 서버를 찾을 수 없습니다');
    }
    return entity;
  }

  async create(dto: CreateWorkerServerDto) {
    const entity = this.workerServerRepository.create({
      serverName: dto.serverName,
      serverUrl: dto.serverUrl,
      apiKey: dto.apiKey,
      callbackSecret: dto.callbackSecret ?? null,
      gpuInfo: dto.gpuInfo ?? null,
      maxConcurrentJobs: dto.maxConcurrentJobs ?? 1,
      defaultSttModel: dto.defaultSttModel ?? 'large-v3',
      defaultLlmModel: dto.defaultLlmModel ?? 'llama3',
      serverStatus: WorkerServerStatus.OFFLINE,
    });

    const saved = await this.workerServerRepository.save(entity);
    return {
      workerServerSeq: saved.workerServerSeq,
      message: 'Worker 서버가 등록되었습니다.',
    };
  }

  async update(workerServerSeq: number, dto: UpdateWorkerServerDto) {
    const entity = await this.workerServerRepository.findOne({
      where: { workerServerSeq, serverIsdel: 'N' },
    });
    if (!entity) {
      throw new NotFoundException('Worker 서버를 찾을 수 없습니다');
    }

    if (dto.serverName !== undefined) entity.serverName = dto.serverName;
    if (dto.serverUrl !== undefined) entity.serverUrl = dto.serverUrl;
    if (dto.apiKey !== undefined) entity.apiKey = dto.apiKey;
    if (dto.callbackSecret !== undefined) entity.callbackSecret = dto.callbackSecret;
    if (dto.gpuInfo !== undefined) entity.gpuInfo = dto.gpuInfo;
    if (dto.maxConcurrentJobs !== undefined) entity.maxConcurrentJobs = dto.maxConcurrentJobs;
    if (dto.defaultSttModel !== undefined) entity.defaultSttModel = dto.defaultSttModel;
    if (dto.defaultLlmModel !== undefined) entity.defaultLlmModel = dto.defaultLlmModel;

    await this.workerServerRepository.save(entity);
    return {
      workerServerSeq: entity.workerServerSeq,
      message: 'Worker 서버가 수정되었습니다.',
    };
  }

  async remove(workerServerSeq: number) {
    const entity = await this.workerServerRepository.findOne({
      where: { workerServerSeq, serverIsdel: 'N' },
    });
    if (!entity) {
      throw new NotFoundException('Worker 서버를 찾을 수 없습니다');
    }

    entity.serverIsdel = 'Y';
    await this.workerServerRepository.save(entity);
    return {
      workerServerSeq: entity.workerServerSeq,
      message: 'Worker 서버가 삭제되었습니다.',
    };
  }

  async health(workerServerSeq: number) {
    const entity = await this.workerServerRepository.findOne({
      where: { workerServerSeq, serverIsdel: 'N' },
    });
    if (!entity) {
      throw new NotFoundException('Worker 서버를 찾을 수 없습니다');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${entity.serverUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${entity.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Update server status
      entity.serverStatus = WorkerServerStatus.ONLINE;
      entity.lastHealthCheck = new Date();
      await this.workerServerRepository.save(entity);

      return {
        serverStatus: WorkerServerStatus.ONLINE,
        ...data,
      };
    } catch (error: any) {
      // Update server status to ERROR
      entity.serverStatus = WorkerServerStatus.ERROR;
      entity.lastHealthCheck = new Date();
      await this.workerServerRepository.save(entity);

      return {
        serverStatus: WorkerServerStatus.ERROR,
        error: error.message || '헬스체크 실패',
      };
    }
  }
}
