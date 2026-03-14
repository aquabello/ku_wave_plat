import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as net from 'net';
import { Server } from 'socket.io';
import {
  SocketLogEntry,
  TcpServerStatus,
} from './interfaces/socket-session.interface';
import { CommandFormat } from './dto/socket-command.dto';

@Injectable()
export class SocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocketService.name);
  private ioServer: Server | null = null;
  private tcpServer: net.Server | null = null;
  private connectedClients = 0;
  private readonly serverPort: number;
  private activeNfcAbort: (() => void) | null = null;

  private readonly RESPONSE_TIMEOUT_MS = 5000;
  private readonly NFC_WAIT_TIMEOUT_MS = 30000;

  private readonly AUTO_RESPONSE_MAP: Record<string, { hex: string; label: string }> = {
    '4E66632073617665': { hex: 'EEB111000103E6100100FFFCFFFF', label: 'MAIN 페이지 전환 (자동)' },
    '4E6663206E6F':     { hex: 'EEB111000103E6100100FFFCFFFF', label: 'MAIN 페이지 전환 (자동)' },
  };

  private readonly RECORDER_COMMANDS: Record<string, string> = {
    '5245434F524445524F4E': 'RECORDER ON',
    '5245434F524445524F4646': 'RECORDER OFF',
  };

  constructor() {
    this.serverPort = parseInt(process.env.SOCKET_SERVER_PORT ?? '9090', 10);
  }

  onModuleInit() {
    this.startTcpServer();
    this.logger.log('SocketService initialized');
  }

  onModuleDestroy() {
    if (this.tcpServer) {
      this.tcpServer.close();
      this.tcpServer = null;
    }
    this.logger.log('TCP server closed');
  }

  setIoServer(server: Server) {
    this.ioServer = server;
  }

  private startTcpServer() {
    this.tcpServer = net.createServer((socket) => {
      this.connectedClients++;
      const remoteAddr = `${socket.remoteAddress}:${socket.remotePort}`;
      this.logger.log(`TCP server: client connected from ${remoteAddr}`);
      this.broadcastLog({
        direction: 'SYS',
        timestamp: new Date().toISOString(),
        hex: '',
        ascii: `Controller connected: ${remoteAddr}`,
      });
      this.broadcastServerStatus();

      socket.on('data', (data: Buffer) => {
        const rawHex = data.toString('hex').toUpperCase();
        const hex = rawHex.match(/.{2}/g)?.join(' ') ?? '';
        const ascii = this.tryDecodeAscii(data);

        this.broadcastLog({
          direction: 'RX',
          timestamp: new Date().toISOString(),
          hex,
          ascii,
          label: 'TCP Server',
        });

        const normalized = rawHex.replace(/\s/g, '');
        const recorderCmd = this.RECORDER_COMMANDS[normalized];
        if (recorderCmd) {
          this.logger.log(`Recorder command received: ${recorderCmd}`);
          this.broadcastLog({
            direction: 'SYS',
            timestamp: new Date().toISOString(),
            hex: '',
            ascii: `Recorder command: ${recorderCmd}`,
          });
        }
      });

      socket.on('close', () => {
        this.connectedClients--;
        this.logger.log(`TCP server: client disconnected: ${remoteAddr}`);
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `Controller disconnected: ${remoteAddr}`,
        });
        this.broadcastServerStatus();
      });

      socket.on('error', (err: Error) => {
        this.logger.error(`TCP server client error: ${err.message}`);
      });
    });

    this.tcpServer.listen(this.serverPort, () => {
      this.logger.log(`TCP server listening on port ${this.serverPort}`);
      this.broadcastServerStatus();
    });

    this.tcpServer.on('error', (err: Error) => {
      this.logger.error(`TCP server error: ${err.message}`);
    });
  }

  async sendOneShot(
    ip: string,
    port: number,
    hexCommand: string,
    label: string,
    waitForResponse = true,
  ): Promise<{ hex: string; ascii: string } | null> {
    const cleaned = hexCommand.replace(/\s+/g, '');

    const MAIN_PAGE_HEX = 'EEB111000103E6100100FFFCFFFF';
    if (cleaned.toUpperCase() === MAIN_PAGE_HEX && this.activeNfcAbort) {
      this.activeNfcAbort();
      return null;
    }
    const txBuffer = Buffer.from(cleaned, 'hex');
    const txHex = cleaned.toUpperCase().match(/.{2}/g)?.join(' ') ?? '';

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;

      const finish = (result: { hex: string; ascii: string } | null) => {
        if (resolved) return;
        resolved = true;
        socket.removeAllListeners();
        socket.destroy();
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `Connection closed (${ip}:${port})`,
        });
        resolve(result);
      };

      const timeout = setTimeout(() => {
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `Timeout waiting for response from ${ip}:${port}`,
        });
        finish(null);
      }, this.RESPONSE_TIMEOUT_MS);

      socket.connect(port, ip, () => {
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `Connected to ${ip}:${port}`,
        });

        socket.write(txBuffer);
        this.broadcastLog({
          direction: 'TX',
          timestamp: new Date().toISOString(),
          hex: txHex,
          ascii: label,
          label,
        });

        if (!waitForResponse) {
          clearTimeout(timeout);
          setTimeout(() => finish(null), 200);
        }
      });

      socket.on('data', (data: Buffer) => {
        clearTimeout(timeout);
        const rawHex = data.toString('hex').toUpperCase();
        const hex = rawHex.match(/.{2}/g)?.join(' ') ?? '';
        const ascii = this.tryDecodeAscii(data);

        this.broadcastLog({
          direction: 'RX',
          timestamp: new Date().toISOString(),
          hex,
          ascii,
        });

        finish({ hex: rawHex, ascii });
      });

      socket.on('error', (err: Error) => {
        clearTimeout(timeout);
        this.logger.error(`sendOneShot error (${ip}:${port}): ${err.message}`);
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `Error: ${err.message}`,
        });
        finish(null);
      });

      socket.on('close', () => {
        clearTimeout(timeout);
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `Disconnected from ${ip}:${port}`,
        });
        finish(null);
      });
    });
  }

  async sendNfcSequence(
    ip: string,
    port: number,
  ): Promise<'save' | 'no' | 'timeout'> {
    const NFC_PAGE_HEX = 'EEB111001B03E6100100FFFCFFFF';
    const MAIN_PAGE_HEX = 'EEB111000103E6100100FFFCFFFF';

    const cleaned = NFC_PAGE_HEX.replace(/\s+/g, '');
    const txBuffer = Buffer.from(cleaned, 'hex');
    const txHex = cleaned.toUpperCase().match(/.{2}/g)?.join(' ') ?? '';

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;

      const finish = (result: 'save' | 'no' | 'timeout') => {
        if (resolved) return;
        resolved = true;
        this.activeNfcAbort = null;
        socket.removeAllListeners();
        socket.destroy();
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `Connection closed (${ip}:${port})`,
        });
        resolve(result);
      };

      this.activeNfcAbort = () => {
        clearTimeout(timeout);
        if (socket.writable) {
          const mainBuffer = Buffer.from(MAIN_PAGE_HEX, 'hex');
          const mainHex = MAIN_PAGE_HEX.toUpperCase().match(/.{2}/g)?.join(' ') ?? '';
          socket.write(mainBuffer);
          this.broadcastLog({
            direction: 'TX',
            timestamp: new Date().toISOString(),
            hex: mainHex,
            ascii: 'MAIN 페이지 전환',
            label: 'MAIN 페이지 전환',
          });
        }
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: 'NFC 대기 중단 — MAIN 페이지 전환 완료',
        });
        setTimeout(() => finish('no'), 200);
      };

      const timeout = setTimeout(() => {
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `30초 응답 없음 — MAIN 페이지 전환 후 종료`,
        });

        const mainBuffer = Buffer.from(MAIN_PAGE_HEX, 'hex');
        const mainHex = MAIN_PAGE_HEX.toUpperCase().match(/.{2}/g)?.join(' ') ?? '';
        if (socket.writable) {
          socket.write(mainBuffer);
          this.broadcastLog({
            direction: 'TX',
            timestamp: new Date().toISOString(),
            hex: mainHex,
            ascii: 'MAIN 페이지 전환 (타임아웃)',
            label: 'MAIN 페이지 전환 (타임아웃)',
          });
        }

        setTimeout(() => finish('timeout'), 300);
      }, this.NFC_WAIT_TIMEOUT_MS);

      socket.connect(port, ip, () => {
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `NFC sequence: connected to ${ip}:${port}`,
        });

        socket.write(txBuffer);
        this.broadcastLog({
          direction: 'TX',
          timestamp: new Date().toISOString(),
          hex: txHex,
          ascii: 'NFC 페이지 전환',
          label: 'NFC 페이지 전환',
        });
      });

      socket.on('data', (data: Buffer) => {
        clearTimeout(timeout);
        const rawHex = data.toString('hex').toUpperCase();
        const hex = rawHex.match(/.{2}/g)?.join(' ') ?? '';
        const ascii = this.tryDecodeAscii(data);

        this.broadcastLog({
          direction: 'RX',
          timestamp: new Date().toISOString(),
          hex,
          ascii,
        });

        const normalized = rawHex.replace(/\s/g, '');

        if (normalized === MAIN_PAGE_HEX) {
          this.broadcastLog({
            direction: 'SYS',
            timestamp: new Date().toISOString(),
            hex: '',
            ascii: 'MAIN 페이지 전환 수신 — 대기 종료',
          });
          setTimeout(() => finish('no'), 100);
          return;
        }

        const autoResponse = this.AUTO_RESPONSE_MAP[normalized];
        if (autoResponse) {
          const mainBuffer = Buffer.from(autoResponse.hex, 'hex');
          const mainHex = autoResponse.hex.toUpperCase().match(/.{2}/g)?.join(' ') ?? '';
          socket.write(mainBuffer);
          this.broadcastLog({
            direction: 'TX',
            timestamp: new Date().toISOString(),
            hex: mainHex,
            ascii: autoResponse.label,
            label: autoResponse.label,
          });
        }

        const result: 'save' | 'no' =
          normalized === '4E66632073617665' ? 'save' : 'no';

        setTimeout(() => finish(result), 300);
      });

      socket.on('error', (err: Error) => {
        clearTimeout(timeout);
        this.logger.error(`NFC sequence error (${ip}:${port}): ${err.message}`);
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `NFC Error: ${err.message}`,
        });
        finish('timeout');
      });

      socket.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  sendManualOneShot(
    ip: string,
    port: number,
    command: string,
    format: CommandFormat,
  ): Promise<{ hex: string; ascii: string } | null> {
    let hexCommand: string;
    let label: string;

    if (format === CommandFormat.HEX) {
      hexCommand = command.replace(/\s+/g, '');
      label = `Manual (HEX)`;
    } else {
      hexCommand = Buffer.from(command, 'utf8').toString('hex');
      label = `Manual (TEXT): ${command}`;
    }

    return this.sendOneShot(ip, port, hexCommand, label);
  }

  simulateRx(hexCommand: string, label?: string) {
    const cleaned = hexCommand.replace(/\s+/g, '');
    const hex = cleaned.toUpperCase().match(/.{2}/g)?.join(' ') ?? '';

    this.broadcastLog({
      direction: 'RX',
      timestamp: new Date().toISOString(),
      hex,
      ascii: label ?? '',
      label: `${label} (시뮬레이션)`,
    });
  }

  getServerStatus(): TcpServerStatus {
    return {
      listening: this.tcpServer?.listening ?? false,
      port: this.serverPort,
      connectedClients: this.connectedClients,
    };
  }

  private broadcastServerStatus() {
    const status = this.getServerStatus();
    this.ioServer?.to('controller-socket').emit('socket:server-status', status);
  }

  private broadcastLog(log: SocketLogEntry) {
    this.ioServer?.to('controller-socket').emit('socket:data', log);
  }

  private tryDecodeAscii(buffer: Buffer): string {
    const text = buffer.toString('utf8');
    const hasBrokenChars = /[\uFFFD\x00-\x08\x0E-\x1F]/.test(text);
    return hasBrokenChars ? '' : text;
  }
}
