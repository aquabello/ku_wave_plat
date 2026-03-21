import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import * as http from 'http';
import {
  PROTOCOL_FIXED_VALUE,
  CMD_PROPERTY,
  CMD_STATUS,
  COMMAND_TYPE,
  RECORDING_STATUS_MAP,
  PROTOCOL_HEADER_SIZE,
  MIN_RESPONSE_SIZE,
  type ProtocolResponse,
  type RecordingStatusResult,
  type StorageInfo,
  type FullStatusResult,
} from '../interfaces/protocol.interface';

@Injectable()
export class RecorderProtocolService {
  private readonly logger = new Logger(RecorderProtocolService.name);
  private messageIdCounter = 0;
  private readonly CONNECT_TIMEOUT_MS = 5000;
  private readonly RESPONSE_TIMEOUT_MS = 10000;

  private nextMessageId(): number {
    this.messageIdCounter = (this.messageIdCounter + 1) & 0xffff;
    return this.messageIdCounter;
  }

  private calculateChecksum(data: Buffer): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum = (sum + data[i]) & 0xff;
    }
    return (~sum + 1) & 0xff;
  }

  private buildPacket(cmd: number, property: number, data?: Buffer): Buffer {
    const dataLen = data?.length ?? 0;
    const totalLen = PROTOCOL_HEADER_SIZE + dataLen + 1; // +1 for checksum
    const packet = Buffer.alloc(totalLen);

    let offset = 0;
    packet.writeUInt32BE(totalLen, offset);
    offset += 4;
    packet.writeUInt8(PROTOCOL_FIXED_VALUE[0], offset++);
    packet.writeUInt8(PROTOCOL_FIXED_VALUE[1], offset++);
    packet.writeUInt16BE(this.nextMessageId(), offset);
    offset += 2;
    packet.writeUInt16BE(cmd, offset);
    offset += 2;
    packet.writeUInt8(property, offset++);

    if (data && dataLen > 0) {
      data.copy(packet, offset);
      offset += dataLen;
    }

    packet[offset] = this.calculateChecksum(packet.subarray(0, offset));
    return packet;
  }

  private parseResponse(buffer: Buffer): ProtocolResponse {
    if (buffer.length < MIN_RESPONSE_SIZE) {
      return { success: false, cmd: 0, messageId: 0, data: Buffer.alloc(0) };
    }

    const length = buffer.readUInt32BE(0);
    const messageId = buffer.readUInt16BE(6);
    const cmd = buffer.readUInt16BE(8);
    const cmdStatus = buffer.readUInt8(11);

    const dataStart = 12;
    const dataEnd = length - 1; // exclude checksum
    const data = dataEnd > dataStart ? buffer.subarray(dataStart, dataEnd) : Buffer.alloc(0);

    return {
      success: cmdStatus === CMD_STATUS.ACK,
      cmd,
      messageId,
      data,
    };
  }

  async sendCommand(
    ip: string,
    port: number,
    cmd: number,
    property: number,
    data?: Buffer,
  ): Promise<ProtocolResponse> {
    const packet = this.buildPacket(cmd, property, data);

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;
      let receivedBuffer = Buffer.alloc(0);
      let expectedLength = 0;

      const finish = (result: ProtocolResponse) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(connectTimer);
        clearTimeout(responseTimer);
        socket.removeAllListeners();
        socket.destroy();
        resolve(result);
      };

      const failResponse: ProtocolResponse = {
        success: false,
        cmd,
        messageId: 0,
        data: Buffer.alloc(0),
      };

      const connectTimer = setTimeout(() => {
        this.logger.warn(`Connect timeout: ${ip}:${port}`);
        finish(failResponse);
      }, this.CONNECT_TIMEOUT_MS);

      const responseTimer = setTimeout(() => {
        this.logger.warn(`Response timeout: ${ip}:${port} cmd=0x${cmd.toString(16)}`);
        finish(failResponse);
      }, this.CONNECT_TIMEOUT_MS + this.RESPONSE_TIMEOUT_MS);

      socket.connect(port, ip, () => {
        clearTimeout(connectTimer);
        socket.write(packet);
        this.logger.debug(`TX → ${ip}:${port} cmd=0x${cmd.toString(16)} [${packet.length}B]`);
      });

      socket.on('data', (chunk: Buffer) => {
        receivedBuffer = Buffer.concat([receivedBuffer, chunk]);

        if (expectedLength === 0 && receivedBuffer.length >= 4) {
          expectedLength = receivedBuffer.readUInt32BE(0);
        }

        if (expectedLength > 0 && receivedBuffer.length >= expectedLength) {
          const response = this.parseResponse(receivedBuffer.subarray(0, expectedLength));
          this.logger.debug(
            `RX ← ${ip}:${port} cmd=0x${response.cmd.toString(16)} ${response.success ? 'ACK' : 'NACK'} [${expectedLength}B]`,
          );
          finish(response);
        }
      });

      socket.on('error', (err: Error) => {
        this.logger.error(`Socket error (${ip}:${port}): ${err.message}`);
        finish(failResponse);
      });

      socket.on('close', () => {
        finish(failResponse);
      });
    });
  }

  async startRecording(ip: string, port: number): Promise<{ success: boolean; filePath?: string }> {
    const res = await this.sendCommand(ip, port, COMMAND_TYPE.RECORDING_START, CMD_PROPERTY.EXECUTE);

    let filePath: string | undefined;
    if (res.success && res.data.length > 0) {
      filePath = res.data.toString('utf8').replace(/\0+$/g, '');
      this.logger.log(`Recording started — filePath from recorder: ${filePath}`);
    }

    return { success: res.success, filePath };
  }

  async stopRecording(ip: string, port: number): Promise<boolean> {
    const res = await this.sendCommand(ip, port, COMMAND_TYPE.RECORDING_STOP, CMD_PROPERTY.EXECUTE);
    return res.success;
  }

  async pauseRecording(ip: string, port: number): Promise<boolean> {
    const res = await this.sendCommand(ip, port, COMMAND_TYPE.RECORDING_PAUSE, CMD_PROPERTY.EXECUTE);
    return res.success;
  }

  async getRecordingStatus(ip: string, port: number): Promise<RecordingStatusResult> {
    const res = await this.sendCommand(ip, port, COMMAND_TYPE.RECORDING_STATUS, CMD_PROPERTY.GET);
    const rawValue = res.data.length > 0 ? res.data.readUInt8(0) : 0x02;
    return {
      status: RECORDING_STATUS_MAP[rawValue] ?? 'STOPPED',
      rawValue,
    };
  }

  async getRecordingTime(ip: string, port: number): Promise<number> {
    const res = await this.sendCommand(ip, port, COMMAND_TYPE.RECORDING_TIME, CMD_PROPERTY.GET);
    if (res.data.length >= 8) {
      return Number(res.data.readBigInt64LE(0));
    }
    return 0;
  }

  async getStorageInfo(ip: string, port: number): Promise<StorageInfo> {
    const res = await this.sendCommand(ip, port, COMMAND_TYPE.RECORDING_STORAGE, CMD_PROPERTY.GET);
    if (res.data.length >= 16) {
      const totalBytes = res.data.readBigInt64LE(0);
      const availableBytes = res.data.readBigInt64LE(8);
      const total = Number(totalBytes);
      const usedPercent = total > 0 ? Math.round(((total - Number(availableBytes)) / total) * 100) : 0;
      return { totalBytes, availableBytes, usedPercent };
    }
    return { totalBytes: 0n, availableBytes: 0n, usedPercent: 0 };
  }

  async setPreset(ip: string, port: number, presetNumber: number): Promise<boolean> {
    const data = Buffer.from([presetNumber & 0xff]);
    const res = await this.sendCommand(ip, port, COMMAND_TYPE.PRESET_SELECT, CMD_PROPERTY.SET, data);
    return res.success;
  }

  async getPreset(ip: string, port: number): Promise<number> {
    const res = await this.sendCommand(ip, port, COMMAND_TYPE.PRESET_SELECT, CMD_PROPERTY.GET);
    return res.data.length > 0 ? res.data.readUInt8(0) : 0;
  }

  // ──────────────── PTZ 제어 ────────────────

  async ptzMove(ip: string, port: number, direction: string): Promise<boolean> {
    const cmdMap: Record<string, number> = {
      left: COMMAND_TYPE.PTZ_LEFT,
      right: COMMAND_TYPE.PTZ_RIGHT,
      up: COMMAND_TYPE.PTZ_UP,
      down: COMMAND_TYPE.PTZ_DOWN,
      leftUp: COMMAND_TYPE.PTZ_LEFT_UP,
      rightUp: COMMAND_TYPE.PTZ_RIGHT_UP,
      leftDown: COMMAND_TYPE.PTZ_LEFT_DOWN,
      rightDown: COMMAND_TYPE.PTZ_RIGHT_DOWN,
    };
    const cmd = cmdMap[direction];
    if (!cmd) return false;
    const res = await this.sendCommand(ip, port, cmd, CMD_PROPERTY.EXECUTE);
    return res.success;
  }

  async ptzStop(ip: string, port: number): Promise<boolean> {
    const res = await this.sendCommand(ip, port, COMMAND_TYPE.PTZ_MOVE_STOP, CMD_PROPERTY.EXECUTE);
    return res.success;
  }

  async ptzZoom(ip: string, port: number, direction: 'in' | 'out'): Promise<boolean> {
    const cmd = direction === 'in' ? COMMAND_TYPE.PTZ_ZOOM_IN : COMMAND_TYPE.PTZ_ZOOM_OUT;
    const res = await this.sendCommand(ip, port, cmd, CMD_PROPERTY.EXECUTE);
    return res.success;
  }

  async ptzZoomStop(ip: string, port: number): Promise<boolean> {
    const res = await this.sendCommand(ip, port, COMMAND_TYPE.PTZ_ZOOM_STOP, CMD_PROPERTY.EXECUTE);
    return res.success;
  }

  async ptzHome(ip: string, port: number): Promise<boolean> {
    const res = await this.sendCommand(ip, port, COMMAND_TYPE.PTZ_HOME, CMD_PROPERTY.EXECUTE);
    return res.success;
  }

  async ptzPresetExecute(ip: string, port: number, presetNumber: number): Promise<boolean> {
    const data = Buffer.from([presetNumber & 0xff]);
    const res = await this.sendCommand(ip, port, COMMAND_TYPE.PTZ_PRESET_EXECUTE, CMD_PROPERTY.EXECUTE, data);
    return res.success;
  }

  async getFullStatus(ip: string, port: number): Promise<FullStatusResult> {
    const recording = await this.getRecordingStatus(ip, port);
    const elapsedSec = await this.getRecordingTime(ip, port);
    const storage = await this.getStorageInfo(ip, port);
    return { recording, elapsedSec, storage };
  }

  // ──────────────── REST API (HTTP 80) ────────────────

  async restStartRecording(ip: string, title?: string): Promise<{ state: string; filepath: string }> {
    const body = JSON.stringify({ title: title ?? '' });
    const result = await this.httpRequest(ip, 'POST', '/api/record', body);
    this.logger.log(`REST recording started: ${JSON.stringify(result)}`);
    return result as { state: string; filepath: string };
  }

  async restGetRecordStatus(ip: string): Promise<{ state: string; filepath: string; time: number }> {
    return this.httpRequest(ip, 'GET', '/api/record') as Promise<{ state: string; filepath: string; time: number }>;
  }

  private httpRequest(ip: string, method: string, path: string, body?: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: ip,
        port: 80,
        path,
        method,
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ raw: data });
          }
        });
      });

      req.on('error', (err) => {
        this.logger.error(`REST API error (${ip}${path}): ${err.message}`);
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`REST API timeout (${ip}${path})`));
      });

      if (body) req.write(body);
      req.end();
    });
  }
}
