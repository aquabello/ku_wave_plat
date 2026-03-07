import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { TbAiWorkerServer } from '../entities/tb-ai-worker-server.entity';

@Injectable()
export class CallbackGuard implements CanActivate {
  private readonly logger = new Logger(CallbackGuard.name);

  constructor(
    @InjectRepository(TbAiWorkerServer)
    private readonly workerServerRepository: Repository<TbAiWorkerServer>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-callback-signature'];

    if (!signature) {
      throw new UnauthorizedException('X-Callback-Signature 헤더가 없습니다');
    }

    const rawBody = JSON.stringify(request.body);

    const servers = await this.workerServerRepository.find({
      where: { serverIsdel: 'N' },
      select: ['workerServerSeq', 'callbackSecret'],
    });

    for (const server of servers) {
      if (!server.callbackSecret) continue;

      const expectedSignature =
        'sha256=' +
        crypto
          .createHmac('sha256', server.callbackSecret)
          .update(rawBody)
          .digest('hex');

      if (signature === expectedSignature) {
        request.workerServerSeq = server.workerServerSeq;
        return true;
      }
    }

    this.logger.warn('Callback signature verification failed');
    throw new UnauthorizedException('서명 검증 실패');
  }
}
