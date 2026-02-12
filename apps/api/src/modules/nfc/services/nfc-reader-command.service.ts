import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbNfcReader } from '../entities/tb-nfc-reader.entity';
import { TbNfcReaderCommand } from '../entities/tb-nfc-reader-command.entity';
import { TbSpaceDevice } from '@modules/controller/devices/entities/tb-space-device.entity';
import { TbPresetCommand } from '@modules/controller/presets/entities/tb-preset-command.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { UpdateReaderCommandsDto } from '../dto/nfc-reader-command.dto';

@Injectable()
export class NfcReaderCommandService {
  private readonly logger = new Logger(NfcReaderCommandService.name);

  constructor(
    @InjectRepository(TbNfcReader)
    private readonly readerRepository: Repository<TbNfcReader>,
    @InjectRepository(TbNfcReaderCommand)
    private readonly readerCommandRepository: Repository<TbNfcReaderCommand>,
    @InjectRepository(TbSpaceDevice)
    private readonly spaceDeviceRepository: Repository<TbSpaceDevice>,
    @InjectRepository(TbPresetCommand)
    private readonly presetCommandRepository: Repository<TbPresetCommand>,
    @InjectRepository(TbSpace)
    private readonly spaceRepository: Repository<TbSpace>,
    @InjectRepository(TbBuilding)
    private readonly buildingRepository: Repository<TbBuilding>,
  ) {}

  async getReaderCommands(readerSeq: number) {
    // Step 1: Find reader
    const reader = await this.readerRepository.findOne({
      where: { readerSeq, readerIsdel: 'N' },
    });

    if (!reader) {
      throw new NotFoundException('NFC 리더기를 찾을 수 없습니다');
    }

    // Step 2: Get space and building info
    const space = await this.spaceRepository.findOne({
      where: { spaceSeq: reader.spaceSeq },
    });

    if (!space) {
      throw new NotFoundException('리더기가 연결된 공간을 찾을 수 없습니다');
    }

    const building = await this.buildingRepository.findOne({
      where: { buildingSeq: space.buildingSeq },
    });

    // Step 3: Get all active devices in the space
    const devices = await this.spaceDeviceRepository
      .createQueryBuilder('sd')
      .leftJoinAndSelect('sd.preset', 'p')
      .where('sd.space_seq = :spaceSeq', { spaceSeq: reader.spaceSeq })
      .andWhere("(sd.device_isdel IS NULL OR sd.device_isdel != 'Y')")
      .orderBy('sd.device_order', 'ASC')
      .getMany();

    // Step 4: Get existing mappings for this reader
    const mappings = await this.readerCommandRepository.find({
      where: {
        readerSeq: reader.readerSeq,
        commandIsdel: 'N',
      },
      relations: ['enterCommand', 'exitCommand'],
    });

    // Create a map for quick lookup
    const mappingMap = new Map<number, typeof mappings[0]>();
    mappings.forEach((m) => {
      mappingMap.set(m.spaceDeviceSeq, m);
    });

    // Step 5: Build device list with available commands
    const deviceList = [];
    for (const device of devices) {
      // Get all commands for this device's preset
      const commands = await this.presetCommandRepository.find({
        where: {
          presetSeq: device.presetSeq,
          commandIsdel: 'N',
        },
        order: {
          commandOrder: 'ASC',
        },
      });

      const mapping = mappingMap.get(device.spaceDeviceSeq);

      deviceList.push({
        spaceDeviceSeq: device.spaceDeviceSeq,
        deviceName: device.deviceName,
        presetName: device.preset?.presetName ?? '',
        deviceStatus: device.deviceStatus,
        isMapped: !!mapping,
        enterCommand: mapping?.enterCommand
          ? {
              commandSeq: mapping.enterCommand.commandSeq,
              commandName: mapping.enterCommand.commandName,
              commandType: mapping.enterCommand.commandType,
            }
          : null,
        exitCommand: mapping?.exitCommand
          ? {
              commandSeq: mapping.exitCommand.commandSeq,
              commandName: mapping.exitCommand.commandName,
              commandType: mapping.exitCommand.commandType,
            }
          : null,
        availableCommands: commands.map((c) => ({
          commandSeq: c.commandSeq,
          commandName: c.commandName,
          commandCode: c.commandCode,
          commandType: c.commandType,
        })),
      });
    }

    return {
      readerSeq: reader.readerSeq,
      readerName: reader.readerName,
      spaceSeq: space.spaceSeq,
      spaceName: space.spaceName,
      buildingName: building?.buildingName ?? '',
      devices: deviceList,
      mappedCount: mappings.length,
      totalDevices: devices.length,
    };
  }

  async updateReaderCommands(readerSeq: number, dto: UpdateReaderCommandsDto) {
    // Step 1: Verify reader exists
    const reader = await this.readerRepository.findOne({
      where: { readerSeq, readerIsdel: 'N' },
    });

    if (!reader) {
      throw new NotFoundException('NFC 리더기를 찾을 수 없습니다');
    }

    // Step 2: Get space devices for validation
    const spaceDevices = await this.spaceDeviceRepository.find({
      where: {
        spaceSeq: reader.spaceSeq,
        deviceIsdel: 'N',
        deviceStatus: 'ACTIVE',
      },
      relations: ['preset'],
    });

    const spaceDeviceSeqSet = new Set(spaceDevices.map((d) => d.spaceDeviceSeq));

    // Step 3: Handle mapAll option
    if (dto.mapAll) {
      // Hard delete all existing mappings (Replace All 방식)
      await this.readerCommandRepository.delete({ readerSeq });

      // Create auto-mappings for all ACTIVE devices
      const autoMappings = [];
      for (const device of spaceDevices) {
        // Find POWER_ON command
        const powerOnCommand = await this.presetCommandRepository.findOne({
          where: {
            presetSeq: device.presetSeq,
            commandType: 'POWER_ON',
            commandIsdel: 'N',
          },
        });

        // Find POWER_OFF command
        const powerOffCommand = await this.presetCommandRepository.findOne({
          where: {
            presetSeq: device.presetSeq,
            commandType: 'POWER_OFF',
            commandIsdel: 'N',
          },
        });

        if (powerOnCommand || powerOffCommand) {
          autoMappings.push(
            this.readerCommandRepository.create({
              readerSeq,
              spaceDeviceSeq: device.spaceDeviceSeq,
              enterCommandSeq: powerOnCommand?.commandSeq ?? null,
              exitCommandSeq: powerOffCommand?.commandSeq ?? null,
              commandIsdel: 'N',
            }),
          );
        }
      }

      if (autoMappings.length > 0) {
        await this.readerCommandRepository.save(autoMappings);
      }

      return {
        message: '모든 활성 장비에 대해 자동 매핑이 완료되었습니다',
        mappedCount: autoMappings.length,
        totalDevices: spaceDevices.length,
      };
    }

    // Step 4: Handle mappings array
    if (dto.mappings !== undefined) {
      // Hard delete all existing mappings (Replace All 방식)
      await this.readerCommandRepository.delete({ readerSeq });

      // If empty array, just return (all mappings deleted)
      if (dto.mappings.length === 0) {
        return {
          message: '모든 명령어 매핑이 삭제되었습니다',
          mappedCount: 0,
          totalDevices: spaceDevices.length,
        };
      }

      // Validate and create new mappings
      for (const mapping of dto.mappings) {
        // Validate spaceDeviceSeq belongs to this reader's space
        if (!spaceDeviceSeqSet.has(mapping.spaceDeviceSeq)) {
          throw new UnprocessableEntityException(
            `장비 시퀀스 ${mapping.spaceDeviceSeq}는 해당 리더기의 공간에 속하지 않습니다`,
          );
        }

        // Validate command seqs if provided
        if (mapping.enterCommandSeq) {
          const cmd = await this.presetCommandRepository.findOne({
            where: { commandSeq: mapping.enterCommandSeq, commandIsdel: 'N' },
          });
          if (!cmd) {
            throw new NotFoundException(
              `입실 명령어 시퀀스 ${mapping.enterCommandSeq}를 찾을 수 없습니다`,
            );
          }
        }

        if (mapping.exitCommandSeq) {
          const cmd = await this.presetCommandRepository.findOne({
            where: { commandSeq: mapping.exitCommandSeq, commandIsdel: 'N' },
          });
          if (!cmd) {
            throw new NotFoundException(
              `퇴실 명령어 시퀀스 ${mapping.exitCommandSeq}를 찾을 수 없습니다`,
            );
          }
        }
      }

      // Create new mappings
      const newMappings = dto.mappings.map((m) =>
        this.readerCommandRepository.create({
          readerSeq,
          spaceDeviceSeq: m.spaceDeviceSeq,
          enterCommandSeq: m.enterCommandSeq ?? null,
          exitCommandSeq: m.exitCommandSeq ?? null,
          commandIsdel: 'N',
        }),
      );

      await this.readerCommandRepository.save(newMappings);

      return {
        message: '명령어 매핑이 성공적으로 저장되었습니다',
        mappedCount: newMappings.length,
        totalDevices: spaceDevices.length,
      };
    }

    // No changes requested
    throw new UnprocessableEntityException(
      'mappings 또는 mapAll 중 하나를 제공해야 합니다',
    );
  }
}
