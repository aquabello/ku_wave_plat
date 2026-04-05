import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbAiVoiceCommand } from './entities/tb-ai-voice-command.entity';
import { TbAiCommandLog } from './entities/tb-ai-command-log.entity';
import { TbAiSpeechSession } from './entities/tb-ai-speech-session.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbSpaceDevice } from '@modules/controller/devices/entities/tb-space-device.entity';
import { TbPresetCommand } from '@modules/controller/presets/entities/tb-preset-command.entity';
import { ControlService } from '@modules/controller/control/control.service';
import { ExecuteCommandDto as ControlExecuteCommandDto } from '@modules/controller/control/dto';
import { CommandExecutionStatus } from './enums/command-execution-status.enum';
import { CreateVoiceCommandDto } from './dto/create-voice-command.dto';
import { UpdateVoiceCommandDto } from './dto/update-voice-command.dto';
import { ListVoiceCommandsDto } from './dto/list-voice-commands.dto';
import { ExecuteCommandDto } from './dto/execute-command.dto';

@Injectable()
export class VoiceCommandsService {
  private readonly logger = new Logger(VoiceCommandsService.name);

  constructor(
    @InjectRepository(TbAiVoiceCommand)
    private readonly voiceCommandRepository: Repository<TbAiVoiceCommand>,
    @InjectRepository(TbAiCommandLog)
    private readonly commandLogRepository: Repository<TbAiCommandLog>,
    @InjectRepository(TbAiSpeechSession)
    private readonly sessionRepository: Repository<TbAiSpeechSession>,
    private readonly controlService: ControlService,
  ) {}

  async list(query: ListVoiceCommandsDto) {
    const qb = this.voiceCommandRepository
      .createQueryBuilder('vc')
      .leftJoin(TbSpace, 's', 's.space_seq = vc.space_seq')
      .leftJoin(TbSpaceDevice, 'sd', 'sd.space_device_seq = vc.space_device_seq')
      .leftJoin(TbPresetCommand, 'cmd', 'cmd.command_seq = vc.command_seq')
      .select([
        'vc.voice_command_seq AS voiceCommandSeq',
        'vc.space_seq AS spaceSeq',
        's.space_name AS spaceName',
        'vc.keyword AS keyword',
        'vc.keyword_aliases AS keywordAliases',
        'vc.space_device_seq AS spaceDeviceSeq',
        'sd.device_name AS deviceName',
        'vc.command_seq AS commandSeq',
        'cmd.command_name AS commandName',
        'vc.min_confidence AS minConfidence',
        'vc.command_priority AS commandPriority',
        'vc.reg_date AS regDate',
      ])
      .where("vc.command_isdel = 'N'");

    if (query.spaceSeq) {
      qb.andWhere('vc.space_seq = :spaceSeq', { spaceSeq: query.spaceSeq });
    }
    if (query.search) {
      qb.andWhere(
        '(vc.keyword LIKE :search OR vc.keyword_aliases LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const rawItems = await qb
      .orderBy('vc.command_priority', 'ASC')
      .addOrderBy('vc.reg_date', 'DESC')
      .getRawMany();

    const items = rawItems.map((row) => {
      let keywordAliases: string[] | null = null;
      if (row.keywordAliases) {
        try { keywordAliases = JSON.parse(row.keywordAliases); } catch { /* ignore */ }
      }
      return {
        voiceCommandSeq: row.voiceCommandSeq,
        spaceSeq: row.spaceSeq,
        spaceName: row.spaceName ?? '',
        keyword: row.keyword,
        keywordAliases,
        spaceDeviceSeq: row.spaceDeviceSeq,
        deviceName: row.deviceName ?? '',
        commandSeq: row.commandSeq,
        commandName: row.commandName ?? '',
        minConfidence: row.minConfidence,
        commandPriority: row.commandPriority,
        regDate: row.regDate,
      };
    });

    return { items };
  }

  async create(dto: CreateVoiceCommandDto) {
    const entity = this.voiceCommandRepository.create({
      spaceSeq: dto.spaceSeq,
      keyword: dto.keyword,
      keywordAliases: dto.keywordAliases ? JSON.stringify(dto.keywordAliases) : null,
      spaceDeviceSeq: dto.spaceDeviceSeq,
      commandSeq: dto.commandSeq,
      minConfidence: dto.minConfidence ?? 0.85,
      commandPriority: dto.commandPriority ?? 0,
    });

    const saved = await this.voiceCommandRepository.save(entity);
    return {
      voiceCommandSeq: saved.voiceCommandSeq,
      message: '음성 명령어가 등록되었습니다.',
    };
  }

  async update(voiceCommandSeq: number, dto: UpdateVoiceCommandDto) {
    const entity = await this.voiceCommandRepository.findOne({
      where: { voiceCommandSeq, commandIsdel: 'N' },
    });
    if (!entity) {
      throw new NotFoundException('음성 명령어를 찾을 수 없습니다');
    }

    if (dto.keyword !== undefined) entity.keyword = dto.keyword;
    if (dto.keywordAliases !== undefined) entity.keywordAliases = JSON.stringify(dto.keywordAliases);
    if (dto.spaceDeviceSeq !== undefined) entity.spaceDeviceSeq = dto.spaceDeviceSeq;
    if (dto.commandSeq !== undefined) entity.commandSeq = dto.commandSeq;
    if (dto.minConfidence !== undefined) entity.minConfidence = dto.minConfidence;
    if (dto.commandPriority !== undefined) entity.commandPriority = dto.commandPriority;

    await this.voiceCommandRepository.save(entity);
    return {
      voiceCommandSeq: entity.voiceCommandSeq,
      message: '음성 명령어가 수정되었습니다.',
    };
  }

  async remove(voiceCommandSeq: number) {
    const entity = await this.voiceCommandRepository.findOne({
      where: { voiceCommandSeq, commandIsdel: 'N' },
    });
    if (!entity) {
      throw new NotFoundException('음성 명령어를 찾을 수 없습니다');
    }

    entity.commandIsdel = 'Y';
    await this.voiceCommandRepository.save(entity);
    return {
      voiceCommandSeq: entity.voiceCommandSeq,
      message: '음성 명령어가 삭제되었습니다.',
    };
  }

  async executeCommand(dto: ExecuteCommandDto, tuSeq: number | null) {
    // 1. Verify session exists
    const session = await this.sessionRepository.findOne({
      where: { sessionSeq: dto.sessionSeq, sessionIsdel: 'N' },
    });
    if (!session) {
      throw new NotFoundException('음성인식 세션을 찾을 수 없습니다');
    }

    // 2. Look up voice command
    const voiceCommand = await this.voiceCommandRepository.findOne({
      where: { voiceCommandSeq: dto.voiceCommandSeq, commandIsdel: 'N' },
    });
    if (!voiceCommand) {
      throw new NotFoundException('음성 명령어를 찾을 수 없습니다');
    }

    // 3. Execute device control via ControlService
    let executionStatus = CommandExecutionStatus.EXECUTED;
    let executionResult: Record<string, unknown> = {};
    let success = true;

    try {
      const controlDto = new ControlExecuteCommandDto();
      controlDto.spaceDeviceSeq = voiceCommand.spaceDeviceSeq;
      controlDto.commandSeq = voiceCommand.commandSeq;

      const controlResult = await this.controlService.execute(controlDto, tuSeq, 'VOICE');
      executionResult = {
        deviceName: controlResult.resultMessage,
        resultStatus: controlResult.resultStatus,
        logSeq: controlResult.logSeq,
      };

      if (controlResult.resultStatus !== 'SUCCESS') {
        executionStatus = CommandExecutionStatus.FAILED;
        success = false;
      }
    } catch (error: any) {
      executionStatus = CommandExecutionStatus.FAILED;
      success = false;
      executionResult = { error: error.message };
    }

    // 4. Save to tb_ai_command_log
    const commandLog = this.commandLogRepository.create({
      sessionSeq: dto.sessionSeq,
      voiceCommandSeq: dto.voiceCommandSeq,
      recognizedText: dto.recognizedText,
      matchedKeyword: dto.matchedKeyword,
      matchScore: dto.matchScore,
      verifySource: dto.verifySource ?? null,
      executionStatus,
      executionResult: JSON.stringify(executionResult),
    });
    const savedLog = await this.commandLogRepository.save(commandLog);

    return {
      success,
      commandLogSeq: savedLog.commandLogSeq,
      executionStatus: savedLog.executionStatus,
      executionResult,
      message: success ? '장비 제어가 실행되었습니다.' : '장비 제어에 실패했습니다.',
    };
  }
}
