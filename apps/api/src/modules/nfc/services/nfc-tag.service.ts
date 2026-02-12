import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbNfcCard } from '../entities/tb-nfc-card.entity';
import { TbNfcLog } from '../entities/tb-nfc-log.entity';
import { TbNfcReaderCommand } from '../entities/tb-nfc-reader-command.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbUserBuilding } from '@modules/permissions/entities/tb-user-building.entity';
import { ControlService } from '@modules/controller/control/control.service';
import { NfcTagDto } from '../dto';

interface NfcReaderInfo {
  readerSeq: number;
  spaceSeq: number;
  readerName: string;
  readerCode: string;
}

@Injectable()
export class NfcTagService {
  private readonly logger = new Logger(NfcTagService.name);

  constructor(
    @InjectRepository(TbNfcCard)
    private readonly nfcCardRepository: Repository<TbNfcCard>,
    @InjectRepository(TbNfcLog)
    private readonly nfcLogRepository: Repository<TbNfcLog>,
    @InjectRepository(TbNfcReaderCommand)
    private readonly nfcReaderCommandRepository: Repository<TbNfcReaderCommand>,
    @InjectRepository(TbSpace)
    private readonly spaceRepository: Repository<TbSpace>,
    @InjectRepository(TbUser)
    private readonly userRepository: Repository<TbUser>,
    @InjectRepository(TbUserBuilding)
    private readonly userBuildingRepository: Repository<TbUserBuilding>,
    private readonly controlService: ControlService,
  ) {}

  async processTag(dto: NfcTagDto, reader: NfcReaderInfo) {
    // Get space information early (needed for all responses)
    const space = await this.spaceRepository.findOne({
      where: { spaceSeq: reader.spaceSeq },
    });
    const spaceName = space?.spaceName ?? '';

    // [Step 1] Card Identification
    const card = await this.nfcCardRepository.findOne({
      where: { cardIdentifier: dto.identifier, cardIsdel: 'N' },
    });

    // [Step 2] UNKNOWN - Unregistered card
    if (!card) {
      await this.nfcLogRepository.save(
        this.nfcLogRepository.create({
          readerSeq: reader.readerSeq,
          cardSeq: null,
          tuSeq: null,
          spaceSeq: reader.spaceSeq,
          logType: 'UNKNOWN',
          tagIdentifier: dto.identifier,
          tagAid: dto.aid || null,
          controlResult: null,
          controlDetail: null,
        }),
      );

      return {
        result: 'UNKNOWN',
        logType: 'UNKNOWN',
        spaceName,
        userName: null,
        controlResult: null,
        controlSummary: null,
        message: '미등록 카드입니다',
      };
    }

    // [Step 3] DENIED - Inactive card
    if (card.cardStatus === 'INACTIVE') {
      await this.nfcLogRepository.save(
        this.nfcLogRepository.create({
          readerSeq: reader.readerSeq,
          cardSeq: card.cardSeq,
          tuSeq: card.tuSeq,
          spaceSeq: reader.spaceSeq,
          logType: 'DENIED',
          tagIdentifier: dto.identifier,
          tagAid: dto.aid || null,
          controlResult: null,
          controlDetail: null,
        }),
      );

      const user = await this.userRepository.findOne({ where: { seq: card.tuSeq } });
      const userName = user?.name ?? null;

      return {
        result: 'DENIED',
        logType: 'DENIED',
        spaceName,
        userName,
        controlResult: null,
        controlSummary: null,
        message: '미승인 카드입니다',
      };
    }

    // [Step 3] DENIED - Blocked card
    if (card.cardStatus === 'BLOCKED') {
      await this.nfcLogRepository.save(
        this.nfcLogRepository.create({
          readerSeq: reader.readerSeq,
          cardSeq: card.cardSeq,
          tuSeq: card.tuSeq,
          spaceSeq: reader.spaceSeq,
          logType: 'DENIED',
          tagIdentifier: dto.identifier,
          tagAid: dto.aid || null,
          controlResult: null,
          controlDetail: null,
        }),
      );

      const user = await this.userRepository.findOne({ where: { seq: card.tuSeq } });
      const userName = user?.name ?? null;

      return {
        result: 'DENIED',
        logType: 'DENIED',
        spaceName,
        userName,
        controlResult: null,
        controlSummary: null,
        message: '차단된 카드입니다',
      };
    }

    // [Step 4] Permission Check
    const buildingSeq = space?.buildingSeq;
    if (!buildingSeq) {
      this.logger.error(`Space ${reader.spaceSeq} has no building association`);
      return {
        result: 'DENIED',
        logType: 'DENIED',
        spaceName,
        userName: null,
        controlResult: null,
        controlSummary: null,
        message: '공간 설정 오류',
      };
    }

    const permission = await this.userBuildingRepository.findOne({
      where: { tuSeq: card.tuSeq, buildingSeq },
    });

    if (!permission) {
      await this.nfcLogRepository.save(
        this.nfcLogRepository.create({
          readerSeq: reader.readerSeq,
          cardSeq: card.cardSeq,
          tuSeq: card.tuSeq,
          spaceSeq: reader.spaceSeq,
          logType: 'DENIED',
          tagIdentifier: dto.identifier,
          tagAid: dto.aid || null,
          controlResult: null,
          controlDetail: null,
        }),
      );

      const user = await this.userRepository.findOne({ where: { seq: card.tuSeq } });
      const userName = user?.name ?? null;

      return {
        result: 'DENIED',
        logType: 'DENIED',
        spaceName,
        userName,
        controlResult: null,
        controlSummary: null,
        message: '해당 건물 접근 권한이 없습니다',
      };
    }

    // [Step 5] ENTER/EXIT Toggle
    const lastLog = await this.nfcLogRepository
      .createQueryBuilder('nl')
      .where('nl.reader_seq = :readerSeq', { readerSeq: reader.readerSeq })
      .andWhere('nl.card_seq = :cardSeq', { cardSeq: card.cardSeq })
      .andWhere('nl.log_type IN (:...types)', { types: ['ENTER', 'EXIT'] })
      .orderBy('nl.tagged_at', 'DESC')
      .getOne();

    const logType = lastLog?.logType === 'ENTER' ? 'EXIT' : 'ENTER';
    const commandType = logType === 'ENTER' ? 'POWER_ON' : 'POWER_OFF';

    // [Step 6] Device Control
    let controlResult: 'SUCCESS' | 'FAIL' | 'PARTIAL' | 'SKIPPED' | null = null;
    let controlSummary: {
      totalDevices: number;
      successCount: number;
      failCount: number;
    } | null = null;
    let controlDetailJson: string | null = null;

    try {
      // Check if there are command mappings for this reader
      const mappings = await this.nfcReaderCommandRepository.find({
        where: {
          readerSeq: reader.readerSeq,
          commandIsdel: 'N',
        },
      });

      let controlResponse: {
        results: Array<{
          spaceDeviceSeq: number;
          deviceName: string;
          commandType: string;
          resultStatus: 'SUCCESS' | 'FAIL' | 'TIMEOUT';
          resultMessage: string | null;
        }>;
        successCount: number;
        failCount: number;
      };

      if (mappings.length > 0) {
        // Use mapping-based control
        const mappingsToExecute = mappings
          .map((m) => {
            const commandSeq =
              logType === 'ENTER' ? m.enterCommandSeq : m.exitCommandSeq;
            if (!commandSeq) return null;
            return {
              spaceDeviceSeq: m.spaceDeviceSeq,
              commandSeq,
            };
          })
          .filter((m) => m !== null) as Array<{
          spaceDeviceSeq: number;
          commandSeq: number;
        }>;

        if (mappingsToExecute.length === 0) {
          // No commands mapped for this action (ENTER or EXIT)
          controlResponse = {
            results: [],
            successCount: 0,
            failCount: 0,
          };
        } else {
          controlResponse = await this.controlService.executeForNfcWithMappings(
            mappingsToExecute,
            card.tuSeq,
          );
        }
      } else {
        // No mappings - use default behavior (all devices with POWER_ON/POWER_OFF)
        controlResponse = await this.controlService.executeForNfc(
          reader.spaceSeq,
          commandType,
          card.tuSeq,
        );
      }

      if (controlResponse.results.length === 0) {
        controlResult = 'SKIPPED';
      } else if (controlResponse.failCount === 0) {
        controlResult = 'SUCCESS';
      } else if (controlResponse.successCount === 0) {
        controlResult = 'FAIL';
      } else {
        controlResult = 'PARTIAL';
      }

      controlSummary = {
        totalDevices: controlResponse.results.length,
        successCount: controlResponse.successCount,
        failCount: controlResponse.failCount,
      };

      controlDetailJson = JSON.stringify(controlResponse.results);
    } catch (error: any) {
      this.logger.error(`Device control failed: ${error.message}`);
      controlResult = 'FAIL';
      controlDetailJson = JSON.stringify([{ error: error.message }]);
    }

    // [Step 7] Save NFC Log
    await this.nfcLogRepository.save(
      this.nfcLogRepository.create({
        readerSeq: reader.readerSeq,
        cardSeq: card.cardSeq,
        tuSeq: card.tuSeq,
        spaceSeq: reader.spaceSeq,
        logType,
        tagIdentifier: dto.identifier,
        tagAid: dto.aid || null,
        controlResult,
        controlDetail: controlDetailJson,
      }),
    );

    // [Step 8] Get user name for response
    const user = await this.userRepository.findOne({ where: { seq: card.tuSeq } });
    const userName = user?.name ?? null;

    // [Step 9] Return response
    let result: string;
    if (controlResult === 'PARTIAL') {
      result = 'PARTIAL';
    } else {
      result = 'SUCCESS';
    }

    return {
      result,
      logType,
      spaceName,
      userName,
      controlResult,
      controlSummary,
      message:
        logType === 'ENTER'
          ? `${spaceName} 입실 처리되었습니다`
          : `${spaceName} 퇴실 처리되었습니다`,
    };
  }
}
