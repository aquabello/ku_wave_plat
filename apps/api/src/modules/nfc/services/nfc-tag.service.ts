import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbNfcCard } from '../entities/tb-nfc-card.entity';
import { TbNfcLog } from '../entities/tb-nfc-log.entity';
import { TbNfcReaderCommand } from '../entities/tb-nfc-reader-command.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbSpaceDevice } from '@modules/controller/devices/entities/tb-space-device.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbUserBuilding } from '@modules/permissions/entities/tb-user-building.entity';
import { ControlService } from '@modules/controller/control/control.service';
import { SocketService } from '@modules/controller/socket/socket.service';
import { NfcTagDto } from '../dto';
import { ConfigService } from '@nestjs/config';
import { AiPcClientService } from './ai-pc-client.service';

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
    @InjectRepository(TbSpaceDevice)
    private readonly spaceDeviceRepository: Repository<TbSpaceDevice>,
    private readonly controlService: ControlService,
    private readonly socketService: SocketService,
    private readonly aiPcClientService: AiPcClientService,
    private readonly configService: ConfigService,
  ) {}

  async processTag(dto: NfcTagDto, reader: NfcReaderInfo) {
    // Get space information early (needed for all responses)
    const space = await this.spaceRepository.findOne({
      where: { spaceSeq: reader.spaceSeq },
      relations: ['building'],
    });
    const spaceName = space?.spaceName ?? '';
    const buildingName = space?.building?.buildingName ?? '';

    // [Step 0] 식별 불가 카드 즉시 반환
    if (!dto.identifier || dto.identifier === 'UNKNOWN') {
      return {
        result: 'UNKNOWN',
        logType: 'UNKNOWN' as const,
        spaceName,
        userName: null,
        controlResult: null,
        controlSummary: null,
        message: '카드 식별값을 읽을 수 없습니다',
      };
    }

    // [Step 1] Card Identification (소프트 삭제 포함 조회)
    let card = await this.nfcCardRepository.findOne({
      where: { cardIdentifier: dto.identifier, cardIsdel: 'N' },
    });

    // 소프트 삭제된 카드가 있으면 복구
    if (!card) {
      const deletedCard = await this.nfcCardRepository.findOne({
        where: { cardIdentifier: dto.identifier, cardIsdel: 'Y' },
      });
      if (deletedCard) {
        deletedCard.cardIsdel = 'N';
        deletedCard.cardStatus = 'ACTIVE';
        deletedCard.cardAid = dto.aid ?? deletedCard.cardAid;
        await this.nfcCardRepository.save(deletedCard);
        this.logger.log(`카드 복구: ${deletedCard.cardLabel ?? deletedCard.cardIdentifier}`);
        card = deletedCard;
      }
    }

    // [Step 2] UNKNOWN - Unregistered card
    if (!card) {
      const device = await this.spaceDeviceRepository.findOne({
        where: {
          spaceSeq: reader.spaceSeq,
          deviceStatus: 'ACTIVE',
          deviceIsdel: 'N',
        },
        relations: ['preset'],
        order: { deviceOrder: 'ASC' },
      });

      // IP/port 해석: device override > preset default (control.service.ts와 동일 패턴)
      const deviceIp = device?.deviceIp ?? device?.preset?.commIp;
      const devicePort = device?.devicePort ?? device?.preset?.commPort ?? 9090;

      if (!device || !deviceIp) {
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

      let nfcResult: 'save' | 'no' | 'timeout' = 'timeout';
      try {
        nfcResult = await this.socketService.sendNfcSequence(
          deviceIp,
          devicePort,
        );
      } catch (err) {
        this.logger.error(`sendNfcSequence failed: ${(err as Error).message}`);
      }

      if (nfcResult === 'save') {
        // card_label 자동 채번 (NFC-0001, NFC-0002, ...)
        const lastCard = await this.nfcCardRepository
          .createQueryBuilder('c')
          .where("c.card_label LIKE 'NFC-%'")
          .orderBy('c.card_seq', 'DESC')
          .getOne();
        const lastNum = lastCard?.cardLabel
          ? parseInt(lastCard.cardLabel.replace('NFC-', ''), 10) || 0
          : 0;
        const cardLabel = `NFC-${String(lastNum + 1).padStart(4, '0')}`;

        const newCard = this.nfcCardRepository.create({
          cardIdentifier: dto.identifier,
          cardAid: dto.aid ?? null,
          cardLabel,
          cardType: dto.aid ? 'PHONE' : 'CARD',
          cardStatus: 'ACTIVE',
          tuSeq: null,
          cardIsdel: 'N',
        });
        await this.nfcCardRepository.save(newCard);

        await this.nfcLogRepository
          .createQueryBuilder()
          .update()
          .set({ cardSeq: newCard.cardSeq })
          .where('tag_identifier = :id', { id: dto.identifier })
          .andWhere('card_seq IS NULL')
          .execute();

        await this.nfcLogRepository.save(
          this.nfcLogRepository.create({
            readerSeq: reader.readerSeq,
            cardSeq: newCard.cardSeq,
            tuSeq: null,
            tagIdentifier: dto.identifier,
            tagAid: dto.aid ?? null,
            logType: 'REGISTER_SAVE',
            spaceSeq: reader.spaceSeq,
            controlResult: null,
            controlDetail: null,
          }),
        );

        return {
          result: 'REGISTER_SAVE',
          logType: 'REGISTER_SAVE' as const,
          spaceName,
          userName: null,
          controlResult: null,
          controlSummary: null,
          message: '카드가 등록되었습니다',
        };
      }

      // NO/TIMEOUT: 로그 저장 없이 반환 (MAIN 페이지 전환은 sendNfcSequence 내부에서 자동 처리)
      return {
        result: nfcResult === 'no' ? 'REGISTER_NO' : 'REGISTER_TIMEOUT',
        logType: nfcResult === 'no' ? 'REGISTER_NO' as const : 'REGISTER_TIMEOUT' as const,
        spaceName,
        userName: null,
        controlResult: null,
        controlSummary: null,
        message: nfcResult === 'no' ? '등록이 취소되었습니다' : '응답 시간 초과',
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

      const user = card.tuSeq ? await this.userRepository.findOne({ where: { seq: card.tuSeq } }) : null;
      const userName = user?.name ?? null;

      return {
        result: 'DENIED',
        logType: 'DENIED',
        spaceName,
        buildingName,
        userName,
        cardLabel: card.cardLabel ?? null,
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

      const user = card.tuSeq ? await this.userRepository.findOne({ where: { seq: card.tuSeq } }) : null;
      const userName = user?.name ?? null;

      return {
        result: 'DENIED',
        logType: 'DENIED',
        spaceName,
        buildingName,
        userName,
        cardLabel: card.cardLabel ?? null,
        controlResult: null,
        controlSummary: null,
        message: '차단된 카드입니다',
      };
    }

    // [Step 4] Permission Check (사용자 배정된 카드만)
    if (card.tuSeq !== null) {
      const buildingSeq = space?.buildingSeq;
      if (buildingSeq) {
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
            buildingName,
            userName,
            cardLabel: card.cardLabel ?? null,
            controlResult: null,
            controlSummary: null,
            message: '해당 건물 접근 권한이 없습니다',
          };
        }
      }
    }

    // [Step 5] ENTER/EXIT Toggle (최소 10초 간격 제한)
    const lastLog = await this.nfcLogRepository
      .createQueryBuilder('nl')
      .where('nl.reader_seq = :readerSeq', { readerSeq: reader.readerSeq })
      .andWhere('nl.card_seq = :cardSeq', { cardSeq: card.cardSeq })
      .andWhere('nl.log_type IN (:...types)', { types: ['ENTER', 'EXIT'] })
      .orderBy('nl.tagged_at', 'DESC')
      .getOne();

    if (lastLog?.taggedAt) {
      const elapsed = Date.now() - new Date(lastLog.taggedAt).getTime();
      const COOLDOWN_MS = 30000;
      if (elapsed < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        return {
          result: 'DENIED',
          logType: lastLog.logType as any,
          spaceName,
          buildingName,
          userName: null,
          cardLabel: card.cardLabel ?? null,
          controlResult: null,
          controlSummary: null,
          message: `${remaining}초 후 다시 태깅해주세요`,
        };
      }
    }

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

    // [Step 6-1] AI Recording Control (ku_ai_pc 연동)
    let aiResultDetail: Record<string, unknown> | null = null;
    const aiPcUrl = this.configService.get<string>('AI_PC_URL');
    if (aiPcUrl) {
      const wavePlatUrl = this.configService.get<string>('WAVE_PLAT_SELF_URL')
        ?? `http://localhost:${this.configService.get<number>('API_PORT', 8000)}/api/v1`;

      const callbackUrl = `${wavePlatUrl}/ai-system/ai/callback`;

      if (logType === 'ENTER') {
        const aiResult = await this.aiPcClientService.startRecording(
          aiPcUrl,
          {
            spaceSeq: reader.spaceSeq,
            tuSeq: card.tuSeq,
            callbackUrl,
            wavePlatUrl,
          },
        );
        aiResultDetail = {
          action: 'AI_START',
          success: aiResult.success,
          sessionSeq: aiResult.data?.sessionSeq ?? null,
          error: aiResult.error ?? null,
        };
      } else {
        const aiResult = await this.aiPcClientService.stopRecording(
          aiPcUrl,
          { spaceSeq: reader.spaceSeq },
        );
        aiResultDetail = {
          action: 'AI_STOP',
          success: aiResult.success,
          sessionSeq: aiResult.data?.sessionSeq ?? null,
          filename: aiResult.data?.filename ?? null,
          durationSec: aiResult.data?.durationSec ?? null,
          error: aiResult.error ?? null,
        };
      }
    }

    // [Step 7] Save NFC Log
    // controlDetail에 AI 결과 포함
    let finalControlDetail = controlDetailJson;
    if (aiResultDetail) {
      try {
        const existingDetail = controlDetailJson ? JSON.parse(controlDetailJson) : [];
        const combined = {
          iotControl: existingDetail,
          aiControl: aiResultDetail,
        };
        finalControlDetail = JSON.stringify(combined);
      } catch {
        finalControlDetail = JSON.stringify({
          iotControl: controlDetailJson,
          aiControl: aiResultDetail,
        });
      }
    }

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
        controlDetail: finalControlDetail,
      }),
    );

    // [Step 8] Get user name for response
    const user = card.tuSeq ? await this.userRepository.findOne({ where: { seq: card.tuSeq } }) : null;
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
      buildingName,
      userName,
      cardLabel: card.cardLabel ?? null,
      controlResult,
      controlSummary,
      aiResult: aiResultDetail,
      message:
        logType === 'ENTER'
          ? `${buildingName} ${spaceName} 입실 처리되었습니다`
          : `${buildingName} ${spaceName} 퇴실 처리되었습니다`,
    };
  }
}
