export const PROTOCOL_FIXED_VALUE = [0xcd, 0xa9] as const;

export const CMD_PROPERTY = {
  SET: 0x00,
  GET: 0x01,
  EXECUTE: 0x02,
} as const;

export const CMD_STATUS = {
  ACK: 0x00,
  NACK: 0x01,
} as const;

export const COMMAND_TYPE = {
  RECORDING_STATUS: 0x0000,
  RECORDING_TIME: 0x0001,
  RECORDING_STORAGE: 0x0002,
  PRESET_SELECT: 0x0100,
  RECORDING_START: 0x1000,
  RECORDING_PAUSE: 0x1001,
  RECORDING_STOP: 0x1002,
  SYSTEM_POWER_OFF: 0xf000,
  SYSTEM_RESET: 0xf001,
} as const;

export const RECORDING_STATUS_MAP: Record<number, 'RECORDING' | 'PAUSED' | 'STOPPED'> = {
  0x00: 'RECORDING',
  0x01: 'PAUSED',
  0x02: 'STOPPED',
};

export interface ProtocolResponse {
  success: boolean;
  cmd: number;
  messageId: number;
  data: Buffer;
}

export interface RecordingStatusResult {
  status: 'RECORDING' | 'PAUSED' | 'STOPPED';
  rawValue: number;
}

export interface StorageInfo {
  totalBytes: bigint;
  availableBytes: bigint;
  usedPercent: number;
}

export interface FullStatusResult {
  recording: RecordingStatusResult;
  elapsedSec: number;
  storage: StorageInfo;
}

export const PROTOCOL_HEADER_SIZE = 4 + 2 + 2 + 2 + 1; // Length + Fixed + MsgID + Cmd + Property
export const RESPONSE_HEADER_SIZE = 4 + 2 + 2 + 2 + 1 + 1; // + CmdStatus
export const MIN_PACKET_SIZE = PROTOCOL_HEADER_SIZE + 1; // + Checksum = 12
export const MIN_RESPONSE_SIZE = RESPONSE_HEADER_SIZE + 1; // + Checksum = 13
