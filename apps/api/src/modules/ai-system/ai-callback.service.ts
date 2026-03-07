import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbAiLectureSummary } from './entities/tb-ai-lecture-summary.entity';
import { ProcessStatus } from './enums/process-status.enum';
import { AiCallbackDto } from './dto/ai-callback.dto';

@Injectable()
export class AiCallbackService {
  private readonly logger = new Logger(AiCallbackService.name);

  constructor(
    @InjectRepository(TbAiLectureSummary)
    private readonly summaryRepository: Repository<TbAiLectureSummary>,
  ) {}

  async processCallback(dto: AiCallbackDto) {
    // 1. Find lecture summary by jobId
    const entity = await this.summaryRepository.findOne({
      where: { jobId: dto.jobId, summaryIsdel: 'N' },
    });

    if (!entity) {
      throw new NotFoundException(`jobId '${dto.jobId}'에 해당하는 강의요약을 찾을 수 없습니다`);
    }

    // 2. Check for duplicate callback
    if (entity.processStatus === ProcessStatus.COMPLETED) {
      throw new ConflictException('이미 처리 완료된 강의요약입니다 (중복 Callback)');
    }

    // 3. Process based on status
    if (dto.status === 'COMPLETED' && dto.result) {
      entity.sttText = dto.result.sttText;
      entity.summaryText = dto.result.summaryText;
      entity.processStatus = ProcessStatus.COMPLETED;
      entity.completedAt = new Date();

      if (dto.result.sttLanguage) entity.sttLanguage = dto.result.sttLanguage;
      if (dto.result.sttConfidence !== undefined) entity.sttConfidence = dto.result.sttConfidence;
      if (dto.result.summaryKeywords) {
        entity.summaryKeywords = JSON.stringify(dto.result.summaryKeywords);
      }

      this.logger.log(`AI Callback COMPLETED for jobId: ${dto.jobId}`);
    } else if (dto.status === 'FAILED') {
      entity.processStatus = ProcessStatus.FAILED;
      entity.completedAt = new Date();

      this.logger.warn(
        `AI Callback FAILED for jobId: ${dto.jobId}, error: ${dto.errorCode} - ${dto.errorMessage}`,
      );
    }

    await this.summaryRepository.save(entity);

    return {
      received: true,
      summarySeq: entity.summarySeq,
      processStatus: entity.processStatus,
      message:
        entity.processStatus === ProcessStatus.COMPLETED
          ? '결과가 저장되었습니다.'
          : '실패 상태가 기록되었습니다.',
    };
  }
}
