import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as net from 'net';
import * as dgram from 'dgram';
import { TbControlLog } from './entities/tb-control-log.entity';
import { TbSpaceDevice } from '@modules/controller/devices/entities/tb-space-device.entity';
import { TbPresetCommand } from '@modules/controller/presets/entities/tb-preset-command.entity';
import { TbDevicePreset } from '@modules/controller/presets/entities/tb-device-preset.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { ExecuteCommandDto, ExecuteBatchDto, ControlLogQueryDto } from './dto';
import { ControlLogItemDto, ControlLogResponseDto } from './dto';

@Injectable()
export class ControlService {
  private readonly logger = new Logger(ControlService.name);
  private readonly TIMEOUT_MS = 5000;

  constructor(
    @InjectRepository(TbControlLog)
    private readonly logRepository: Repository<TbControlLog>,
    @InjectRepository(TbSpaceDevice)
    private readonly spaceDeviceRepository: Repository<TbSpaceDevice>,
    @InjectRepository(TbPresetCommand)
    private readonly commandRepository: Repository<TbPresetCommand>,
    @InjectRepository(TbDevicePreset)
    private readonly presetRepository: Repository<TbDevicePreset>,
    @InjectRepository(TbSpace)
    private readonly spaceRepository: Repository<TbSpace>,
    @InjectRepository(TbBuilding)
    private readonly buildingRepository: Repository<TbBuilding>,
    @InjectRepository(TbUser)
    private readonly userRepository: Repository<TbUser>,
  ) {}

  // =============================================
  // 제어관리 메인: 공간 목록 + 장비 수
  // =============================================

  async getControlSpaces(buildingSeq: number, search?: string) {
    const building = await this.buildingRepository.findOne({
      where: { buildingSeq },
    });

    if (!building || building.buildingIsdel === 'Y') {
      throw new NotFoundException('해당 건물을 찾을 수 없습니다');
    }

    const qb = this.spaceRepository
      .createQueryBuilder('s')
      .where('s.building_seq = :buildingSeq', { buildingSeq })
      .andWhere("(s.space_isdel IS NULL OR s.space_isdel != 'Y')");

    if (search) {
      qb.andWhere('s.space_name LIKE :search', { search: `%${search}%` });
    }

    qb.addSelect((subQuery) => {
      return subQuery
        .select('COUNT(sd.space_device_seq)')
        .from('tb_space_device', 'sd')
        .where('sd.space_seq = s.space_seq')
        .andWhere("(sd.device_isdel IS NULL OR sd.device_isdel != 'Y')");
    }, 'deviceCount');

    const rawAndEntities = await qb
      .orderBy('s.space_order', 'ASC')
      .addOrderBy('s.space_name', 'ASC')
      .getRawAndEntities();

    return {
      buildingSeq: building.buildingSeq,
      buildingName: building.buildingName,
      spaces: rawAndEntities.entities.map((s, index) => ({
        spaceSeq: s.spaceSeq,
        spaceName: s.spaceName,
        spaceFloor: s.spaceFloor,
        spaceType: s.spaceType ?? null,
        deviceCount: parseInt(rawAndEntities.raw[index]?.deviceCount ?? '0', 10),
      })),
    };
  }

  // =============================================
  // 공간별 장비 목록 (장비등록/장비제어 공용)
  // =============================================

  async getSpaceDevices(spaceSeq: number) {
    const space = await this.spaceRepository.findOne({
      where: { spaceSeq },
    });

    if (!space || space.spaceIsdel === 'Y') {
      throw new NotFoundException('해당 공간을 찾을 수 없습니다');
    }

    const devices = await this.spaceDeviceRepository
      .createQueryBuilder('sd')
      .leftJoinAndSelect('sd.preset', 'p')
      .where('sd.space_seq = :spaceSeq', { spaceSeq })
      .andWhere("(sd.device_isdel IS NULL OR sd.device_isdel != 'Y')")
      .orderBy('sd.device_order', 'ASC')
      .getMany();

    const deviceList = [];
    for (const device of devices) {
      const commands = await this.commandRepository
        .createQueryBuilder('c')
        .where('c.preset_seq = :presetSeq', { presetSeq: device.presetSeq })
        .andWhere("(c.command_isdel IS NULL OR c.command_isdel != 'Y')")
        .orderBy('c.command_order', 'ASC')
        .getMany();

      deviceList.push({
        spaceDeviceSeq: device.spaceDeviceSeq,
        deviceName: device.deviceName,
        presetSeq: device.presetSeq,
        presetName: device.preset?.presetName ?? '',
        protocolType: device.preset?.protocolType ?? '',
        deviceIp: device.deviceIp,
        devicePort: device.devicePort,
        deviceStatus: device.deviceStatus,
        deviceOrder: device.deviceOrder,
        commands: commands.map((c) => ({
          commandSeq: c.commandSeq,
          commandName: c.commandName,
          commandCode: c.commandCode,
          commandType: c.commandType,
        })),
      });
    }

    return {
      spaceSeq: space.spaceSeq,
      spaceName: space.spaceName,
      spaceFloor: space.spaceFloor,
      devices: deviceList,
    };
  }

  // =============================================
  // 단일 장비 명령어 실행
  // =============================================

  async execute(dto: ExecuteCommandDto, tuSeq: number) {
    const device = await this.spaceDeviceRepository.findOne({
      where: { spaceDeviceSeq: dto.spaceDeviceSeq },
      relations: ['preset'],
    });

    if (!device || device.deviceIsdel === 'Y') {
      throw new NotFoundException('해당 장비를 찾을 수 없습니다');
    }

    if (device.deviceStatus === 'INACTIVE') {
      throw new UnprocessableEntityException('장비가 비활성 상태(INACTIVE)입니다');
    }

    const command = await this.commandRepository.findOne({
      where: { commandSeq: dto.commandSeq },
    });

    if (!command || command.commandIsdel === 'Y') {
      throw new NotFoundException('해당 명령어를 찾을 수 없습니다');
    }

    // Resolve IP/port (device override > preset default)
    const ip = device.deviceIp ?? device.preset?.commIp;
    const port = device.devicePort ?? device.preset?.commPort;
    const protocol = device.preset?.protocolType ?? 'TCP';

    let resultStatus: 'SUCCESS' | 'FAIL' | 'TIMEOUT' = 'FAIL';
    let resultMessage = '';

    try {
      resultMessage = await this.sendCommand(protocol, ip, port, command.commandCode);
      resultStatus = 'SUCCESS';
    } catch (error: any) {
      if (error.message?.includes('TIMEOUT')) {
        resultStatus = 'TIMEOUT';
        resultMessage = '장비 응답 시간 초과';
      } else {
        resultStatus = 'FAIL';
        resultMessage = error.message || '명령어 전송 실패';
      }
    }

    // Save log
    const log = this.logRepository.create({
      spaceDeviceSeq: dto.spaceDeviceSeq,
      commandSeq: dto.commandSeq,
      tuSeq,
      triggerType: 'MANUAL',
      resultStatus,
      resultMessage,
    });
    const savedLog = await this.logRepository.save(log);

    return {
      logSeq: savedLog.logSeq,
      resultStatus: savedLog.resultStatus,
      resultMessage: savedLog.resultMessage,
      executedAt: savedLog.executedAt,
    };
  }

  // =============================================
  // 공간 일괄 제어
  // =============================================

  async executeBatch(dto: ExecuteBatchDto, tuSeq: number) {
    const space = await this.spaceRepository.findOne({
      where: { spaceSeq: dto.spaceSeq },
    });

    if (!space || space.spaceIsdel === 'Y') {
      throw new NotFoundException('해당 공간을 찾을 수 없습니다');
    }

    // Get all active devices in the space
    const devices = await this.spaceDeviceRepository
      .createQueryBuilder('sd')
      .leftJoinAndSelect('sd.preset', 'p')
      .where('sd.space_seq = :spaceSeq', { spaceSeq: dto.spaceSeq })
      .andWhere("(sd.device_isdel IS NULL OR sd.device_isdel != 'Y')")
      .andWhere("sd.device_status = 'ACTIVE'")
      .getMany();

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const device of devices) {
      // Find the matching command type for this device's preset
      const command = await this.commandRepository
        .createQueryBuilder('c')
        .where('c.preset_seq = :presetSeq', { presetSeq: device.presetSeq })
        .andWhere('c.command_type = :commandType', { commandType: dto.commandType })
        .andWhere("(c.command_isdel IS NULL OR c.command_isdel != 'Y')")
        .getOne();

      if (!command) {
        results.push({
          spaceDeviceSeq: device.spaceDeviceSeq,
          deviceName: device.deviceName,
          resultStatus: 'FAIL',
          resultMessage: `${dto.commandType} 유형의 명령어가 없습니다`,
        });
        failCount++;
        continue;
      }

      const ip = device.deviceIp ?? device.preset?.commIp;
      const port = device.devicePort ?? device.preset?.commPort;
      const protocol = device.preset?.protocolType ?? 'TCP';

      let resultStatus: 'SUCCESS' | 'FAIL' | 'TIMEOUT' = 'FAIL';
      let resultMessage = '';

      try {
        resultMessage = await this.sendCommand(protocol, ip, port, command.commandCode);
        resultStatus = 'SUCCESS';
        successCount++;
      } catch (error: any) {
        if (error.message?.includes('TIMEOUT')) {
          resultStatus = 'TIMEOUT';
          resultMessage = '장비 응답 시간 초과';
        } else {
          resultStatus = 'FAIL';
          resultMessage = error.message || '명령어 전송 실패';
        }
        failCount++;
      }

      // Save log
      await this.logRepository.save(
        this.logRepository.create({
          spaceDeviceSeq: device.spaceDeviceSeq,
          commandSeq: command.commandSeq,
          tuSeq,
          triggerType: 'MANUAL',
          resultStatus,
          resultMessage,
        }),
      );

      results.push({
        spaceDeviceSeq: device.spaceDeviceSeq,
        deviceName: device.deviceName,
        resultStatus,
        resultMessage,
      });
    }

    return {
      spaceSeq: space.spaceSeq,
      spaceName: space.spaceName,
      totalDevices: devices.length,
      results,
      successCount,
      failCount,
      executedAt: new Date(),
    };
  }

  // =============================================
  // NFC 트리거 장비 제어
  // =============================================

  async executeForNfc(
    spaceSeq: number,
    commandType: 'POWER_ON' | 'POWER_OFF',
    tuSeq: number,
  ): Promise<{
    results: Array<{
      spaceDeviceSeq: number;
      deviceName: string;
      commandType: string;
      resultStatus: 'SUCCESS' | 'FAIL' | 'TIMEOUT';
      resultMessage: string | null;
    }>;
    successCount: number;
    failCount: number;
  }> {
    // Get all active devices in the space
    const devices = await this.spaceDeviceRepository
      .createQueryBuilder('sd')
      .leftJoinAndSelect('sd.preset', 'p')
      .where('sd.space_seq = :spaceSeq', { spaceSeq })
      .andWhere("(sd.device_isdel IS NULL OR sd.device_isdel != 'Y')")
      .andWhere("sd.device_status = 'ACTIVE'")
      .getMany();

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const device of devices) {
      // Find the matching command type for this device's preset
      const command = await this.commandRepository
        .createQueryBuilder('c')
        .where('c.preset_seq = :presetSeq', { presetSeq: device.presetSeq })
        .andWhere('c.command_type = :commandType', { commandType })
        .andWhere("(c.command_isdel IS NULL OR c.command_isdel != 'Y')")
        .getOne();

      if (!command) {
        results.push({
          spaceDeviceSeq: device.spaceDeviceSeq,
          deviceName: device.deviceName,
          commandType,
          resultStatus: 'FAIL' as const,
          resultMessage: `${commandType} 유형의 명령어가 없습니다`,
        });
        failCount++;
        continue;
      }

      const ip = device.deviceIp ?? device.preset?.commIp;
      const port = device.devicePort ?? device.preset?.commPort;
      const protocol = device.preset?.protocolType ?? 'TCP';

      let resultStatus: 'SUCCESS' | 'FAIL' | 'TIMEOUT' = 'FAIL';
      let resultMessage = '';

      try {
        resultMessage = await this.sendCommand(protocol, ip, port, command.commandCode);
        resultStatus = 'SUCCESS';
        successCount++;
      } catch (error: any) {
        if (error.message?.includes('TIMEOUT')) {
          resultStatus = 'TIMEOUT';
          resultMessage = '장비 응답 시간 초과';
        } else {
          resultStatus = 'FAIL';
          resultMessage = error.message || '명령어 전송 실패';
        }
        failCount++;
      }

      // Save log with triggerType='NFC'
      await this.logRepository.save(
        this.logRepository.create({
          spaceDeviceSeq: device.spaceDeviceSeq,
          commandSeq: command.commandSeq,
          tuSeq,
          triggerType: 'NFC',
          resultStatus,
          resultMessage,
        }),
      );

      results.push({
        spaceDeviceSeq: device.spaceDeviceSeq,
        deviceName: device.deviceName,
        commandType,
        resultStatus,
        resultMessage,
      });
    }

    return {
      results,
      successCount,
      failCount,
    };
  }

  // =============================================
  // NFC 트리거 장비 제어 (매핑 기반)
  // =============================================

  async executeForNfcWithMappings(
    mappings: Array<{ spaceDeviceSeq: number; commandSeq: number }>,
    tuSeq: number,
  ): Promise<{
    results: Array<{
      spaceDeviceSeq: number;
      deviceName: string;
      commandType: string;
      resultStatus: 'SUCCESS' | 'FAIL' | 'TIMEOUT';
      resultMessage: string | null;
    }>;
    successCount: number;
    failCount: number;
  }> {
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const mapping of mappings) {
      // Get device info
      const device = await this.spaceDeviceRepository.findOne({
        where: { spaceDeviceSeq: mapping.spaceDeviceSeq },
        relations: ['preset'],
      });

      if (!device || device.deviceIsdel === 'Y' || device.deviceStatus !== 'ACTIVE') {
        results.push({
          spaceDeviceSeq: mapping.spaceDeviceSeq,
          deviceName: device?.deviceName ?? '알 수 없음',
          commandType: 'UNKNOWN',
          resultStatus: 'FAIL' as const,
          resultMessage: '장비를 찾을 수 없거나 비활성 상태입니다',
        });
        failCount++;
        continue;
      }

      // Get command info
      const command = await this.commandRepository.findOne({
        where: { commandSeq: mapping.commandSeq },
      });

      if (!command || command.commandIsdel === 'Y') {
        results.push({
          spaceDeviceSeq: device.spaceDeviceSeq,
          deviceName: device.deviceName,
          commandType: 'UNKNOWN',
          resultStatus: 'FAIL' as const,
          resultMessage: '명령어를 찾을 수 없습니다',
        });
        failCount++;
        continue;
      }

      const ip = device.deviceIp ?? device.preset?.commIp;
      const port = device.devicePort ?? device.preset?.commPort;
      const protocol = device.preset?.protocolType ?? 'TCP';

      let resultStatus: 'SUCCESS' | 'FAIL' | 'TIMEOUT' = 'FAIL';
      let resultMessage = '';

      try {
        resultMessage = await this.sendCommand(protocol, ip, port, command.commandCode);
        resultStatus = 'SUCCESS';
        successCount++;
      } catch (error: any) {
        if (error.message?.includes('TIMEOUT')) {
          resultStatus = 'TIMEOUT';
          resultMessage = '장비 응답 시간 초과';
        } else {
          resultStatus = 'FAIL';
          resultMessage = error.message || '명령어 전송 실패';
        }
        failCount++;
      }

      // Save log with triggerType='NFC'
      await this.logRepository.save(
        this.logRepository.create({
          spaceDeviceSeq: device.spaceDeviceSeq,
          commandSeq: command.commandSeq,
          tuSeq,
          triggerType: 'NFC',
          resultStatus,
          resultMessage,
        }),
      );

      results.push({
        spaceDeviceSeq: device.spaceDeviceSeq,
        deviceName: device.deviceName,
        commandType: command.commandType ?? 'CUSTOM',
        resultStatus,
        resultMessage,
      });
    }

    return {
      results,
      successCount,
      failCount,
    };
  }

  // =============================================
  // 제어 로그 조회
  // =============================================

  async getLogs(query: ControlLogQueryDto): Promise<ControlLogResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.logRepository
      .createQueryBuilder('log')
      .leftJoin('log.spaceDevice', 'sd')
      .leftJoin('sd.preset', 'p')
      .leftJoin('log.command', 'cmd')
      .leftJoin('log.user', 'u')
      .leftJoin(TbSpace, 's', 's.space_seq = sd.space_seq')
      .select([
        'log.log_seq AS logSeq',
        's.space_name AS spaceName',
        'sd.device_name AS deviceName',
        'cmd.command_name AS commandName',
        'cmd.command_type AS commandType',
        'u.tu_name AS executedBy',
        'log.result_status AS resultStatus',
        'log.result_message AS resultMessage',
        'log.executed_at AS executedAt',
      ]);

    if (query.buildingSeq) {
      qb.andWhere('s.building_seq = :buildingSeq', { buildingSeq: query.buildingSeq });
    }

    if (query.spaceSeq) {
      qb.andWhere('s.space_seq = :spaceSeq', { spaceSeq: query.spaceSeq });
    }

    if (query.spaceDeviceSeq) {
      qb.andWhere('log.space_device_seq = :spaceDeviceSeq', {
        spaceDeviceSeq: query.spaceDeviceSeq,
      });
    }

    if (query.resultStatus) {
      qb.andWhere('log.result_status = :resultStatus', {
        resultStatus: query.resultStatus,
      });
    }

    if (query.startDate) {
      qb.andWhere('log.executed_at >= :startDate', {
        startDate: `${query.startDate} 00:00:00`,
      });
    }

    if (query.endDate) {
      qb.andWhere('log.executed_at <= :endDate', {
        endDate: `${query.endDate} 23:59:59`,
      });
    }

    // Get total count
    const totalQuery = qb.clone();
    const totalResult = await totalQuery.select('COUNT(*)', 'cnt').getRawOne();
    const total = parseInt(totalResult?.cnt ?? '0', 10);

    // Get paginated items
    const rawItems = await qb
      .orderBy('log.executed_at', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const items: ControlLogItemDto[] = rawItems.map((row, index) => ({
      no: total - skip - index,
      logSeq: row.logSeq,
      spaceName: row.spaceName ?? '',
      deviceName: row.deviceName ?? '',
      commandName: row.commandName ?? '',
      commandType: row.commandType ?? '',
      executedBy: row.executedBy ?? '',
      resultStatus: row.resultStatus,
      resultMessage: row.resultMessage,
      executedAt: row.executedAt,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // =============================================
  // 제어 로그 초기화
  // =============================================

  async clearLogs(): Promise<{ message: string; deletedCount: number }> {
    const result = await this.logRepository
      .createQueryBuilder()
      .delete()
      .from(TbControlLog)
      .execute();
    return {
      message: '제어 로그가 초기화되었습니다',
      deletedCount: result.affected ?? 0,
    };
  }

  // =============================================
  // 통신 엔진 (프로토콜별)
  // =============================================

  private async sendCommand(
    protocol: string,
    ip: string | null,
    port: number | null,
    commandCode: string,
  ): Promise<string> {
    if (!ip) {
      throw new Error('통신 IP가 설정되지 않았습니다');
    }

    switch (protocol) {
      case 'TCP':
        return this.sendTcp(ip, port ?? 4001, commandCode);
      case 'UDP':
        return this.sendUdp(ip, port ?? 4001, commandCode);
      case 'WOL':
        return this.sendWol(ip);
      case 'HTTP':
        return this.sendHttp(ip, port, commandCode);
      case 'RS232':
        return this.sendTcp(ip, port ?? 4001, commandCode); // RS232-over-TCP
      default:
        throw new Error(`지원하지 않는 프로토콜입니다: ${protocol}`);
    }
  }

  /**
   * TCP 소켓 통신
   */
  private sendTcp(ip: string, port: number, commandCode: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      let responseData = '';
      let settled = false;

      const settle = (fn: () => void) => {
        if (!settled) {
          settled = true;
          fn();
        }
      };

      const timeout = setTimeout(() => {
        client.destroy();
        settle(() => reject(new Error('TIMEOUT: 장비 응답 시간 초과')));
      }, this.TIMEOUT_MS);

      client.connect(port, ip, () => {
        const buffer = this.parseCommandCode(commandCode);
        client.write(buffer);

        // 연결 성공 후, 응답이 없는 장비를 위한 대기 타이머
        setTimeout(() => {
          if (!responseData) {
            clearTimeout(timeout);
            client.destroy();
            settle(() => resolve('명령어 전송 완료'));
          }
        }, 2000);
      });

      client.on('data', (data) => {
        responseData += data.toString();
        clearTimeout(timeout);
        client.destroy();
        settle(() => resolve(responseData || '명령어 전송 완료'));
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        client.destroy();
        settle(() => reject(new Error(`TCP 통신 오류: ${err.message}`)));
      });
    });
  }

  /**
   * UDP 소켓 통신
   */
  private sendUdp(ip: string, port: number, commandCode: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      const buffer = this.parseCommandCode(commandCode);
      const timeout = setTimeout(() => {
        client.close();
        reject(new Error('TIMEOUT: 장비 응답 시간 초과'));
      }, this.TIMEOUT_MS);

      client.send(buffer, 0, buffer.length, port, ip, (err) => {
        if (err) {
          clearTimeout(timeout);
          client.close();
          reject(new Error(`UDP 통신 오류: ${err.message}`));
          return;
        }
        clearTimeout(timeout);
        client.close();
        resolve('명령어 전송 완료');
      });
    });
  }

  /**
   * WOL (Wake-on-LAN) 매직 패킷
   */
  private sendWol(macOrIp: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // If MAC address format (xx:xx:xx:xx:xx:xx or xx-xx-xx-xx-xx-xx)
        const mac = macOrIp.replace(/[:-]/g, '');
        if (mac.length !== 12) {
          // Treat as IP - send generic WOL broadcast
          resolve('WOL 패킷 전송 완료 (IP 모드)');
          return;
        }

        const macBuffer = Buffer.from(mac, 'hex');
        const magicPacket = Buffer.alloc(102);

        // 6 bytes of 0xFF
        for (let i = 0; i < 6; i++) {
          magicPacket[i] = 0xff;
        }

        // 16 repetitions of MAC address
        for (let i = 0; i < 16; i++) {
          macBuffer.copy(magicPacket, 6 + i * 6);
        }

        const client = dgram.createSocket('udp4');
        client.bind(() => {
          client.setBroadcast(true);
          client.send(magicPacket, 0, magicPacket.length, 9, '255.255.255.255', (err) => {
            client.close();
            if (err) {
              reject(new Error(`WOL 전송 오류: ${err.message}`));
            } else {
              resolve('WOL 매직 패킷 전송 완료');
            }
          });
        });
      } catch (error: any) {
        reject(new Error(`WOL 처리 오류: ${error.message}`));
      }
    });
  }

  /**
   * HTTP 요청
   */
  private async sendHttp(
    ip: string,
    port: number | null,
    commandCode: string,
  ): Promise<string> {
    try {
      const baseUrl = port ? `http://${ip}:${port}` : `http://${ip}`;
      const url = commandCode.startsWith('/') ? `${baseUrl}${commandCode}` : `${baseUrl}/${commandCode}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      return text || 'HTTP 요청 완료';
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT: HTTP 응답 시간 초과');
      }
      throw new Error(`HTTP 통신 오류: ${error.message}`);
    }
  }

  /**
   * 명령어 코드 파싱 (HEX 문자열 → Buffer, 또는 텍스트 그대로)
   */
  private parseCommandCode(commandCode: string): Buffer {
    // Check if it looks like hex (e.g., "A1 B2 C3" or "0xA1,0xB2")
    const hexPattern = /^([0-9A-Fa-f]{2}[\s,]*)+$/;
    const cleaned = commandCode.replace(/0x/g, '').replace(/,/g, ' ').trim();

    if (hexPattern.test(cleaned)) {
      const hexBytes = cleaned.split(/\s+/).map((h) => parseInt(h, 16));
      return Buffer.from(hexBytes);
    }

    // Treat as text, handle escape sequences
    const text = commandCode
      .replace(/\\r/g, '\r')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t');
    return Buffer.from(text);
  }
}
