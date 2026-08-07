import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as net from 'net';
import { Server } from 'socket.io';
import { SocketLogEntry, TcpServerStatus } from './interfaces/socket-session.interface';
import { CommandFormat } from './dto/socket-command.dto';
import { TbRecorder } from '@modules/recorders/entities/recorder.entity';
import { RecorderControlService } from '@modules/recorders/recorder-control.service';

@Injectable()
export class SocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocketService.name);
  private ioServer: Server | null = null;
  private tcpServer: net.Server | null = null;
  private connectedClients = 0;
  private readonly serverPort: number;
  private activeNfcAbort: (() => void) | null = null;

  // Network 1: 컨트롤러로 나가는 상시 연결 (단일 대상, lazy connect)
  private outboundSocket: net.Socket | null = null;
  private outboundTarget: { ip: string; port: number } | null = null;
  private outboundConnectPromise: Promise<net.Socket> | null = null;
  private pendingResolvers: Array<(data: Buffer | null) => void> = [];
  private dataWatcher: ((data: Buffer) => void) | null = null;
  private onOutboundClosed: (() => void) | null = null;

  private readonly RESPONSE_TIMEOUT_MS = 5000;
  private readonly NFC_WAIT_TIMEOUT_MS = 30000;
  private readonly BOOT_CONNECT_MAX_ATTEMPTS = 3;
  private readonly BOOT_CONNECT_RETRY_DELAY_MS = 3000;

  private readonly AUTO_RESPONSE_MAP: Record<string, { hex: string; label: string }> = {
    '4E66632073617665': { hex: 'EEB111000103E6100100FFFCFFFF', label: 'MAIN 페이지 전환 (자동)' },
    '4E6663206E6F': { hex: 'EEB111000103E6100100FFFCFFFF', label: 'MAIN 페이지 전환 (자동)' },
  };

  private readonly RECORDER_COMMANDS: Record<string, string> = {
    '5245434F444552204F4E': 'RECORDER ON', // "RECODER ON"
    '5245434F444552204F4646': 'RECORDER OFF', // "RECODER OFF"
  };

  // TCP 스트림이 여러 조각으로 나뉘어 들어와도(첫 바이트 유실 등) 인식할 수 있도록
  // 수신 hex를 누적해두고 패턴을 찾는다 (RECORDER_COMMANDS 매칭용).
  // 아웃바운드는 대상이 하나뿐이라 인스턴스 필드로 두고, 인바운드는 커넥션별로 로컬 버퍼를 사용한다.
  private readonly RX_BUFFER_MAX_LEN = 200;
  private readonly outboundRxBuffer: { value: string } = { value: '' };

  constructor(
    @InjectRepository(TbRecorder)
    private readonly recorderRepo: Repository<TbRecorder>,
    private readonly recorderControlService: RecorderControlService,
  ) {
    this.serverPort = parseInt(process.env.SOCKET_SERVER_PORT ?? '9090', 10);
  }

  onModuleInit() {
    this.startTcpServer();
    this.logger.log('SocketService initialized');

    const controllerHost = process.env.CONTROLLER_SOCKET_HOST;
    const controllerPort = parseInt(process.env.CONTROLLER_SOCKET_PORT ?? '9080', 10);
    if (controllerHost) {
      this.connectOutboundOnBoot(controllerHost, controllerPort);
    }
  }

  /**
   * Network 1: 서버 부팅 시 컨트롤러 소켓(포트 9080)에 무조건 연결을 시도한다.
   * 실패 시 최대 BOOT_CONNECT_MAX_ATTEMPTS회까지 재시도한다.
   */
  private async connectOutboundOnBoot(ip: string, port: number) {
    for (let attempt = 1; attempt <= this.BOOT_CONNECT_MAX_ATTEMPTS; attempt++) {
      try {
        await this.connectOutbound(ip, port);
        this.logger.log(`Boot-time outbound connect succeeded (${ip}:${port}), attempt ${attempt}`);
        return;
      } catch (err) {
        this.logger.warn(
          `Boot-time outbound connect failed (${ip}:${port}) attempt ${attempt}/${this.BOOT_CONNECT_MAX_ATTEMPTS}: ${(err as Error).message}`,
        );
        if (attempt < this.BOOT_CONNECT_MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, this.BOOT_CONNECT_RETRY_DELAY_MS));
        }
      }
    }

    this.logger.error(
      `Boot-time outbound connect failed after ${this.BOOT_CONNECT_MAX_ATTEMPTS} attempts (${ip}:${port})`,
    );
    this.broadcastLog({
      direction: 'SYS',
      timestamp: new Date().toISOString(),
      hex: '',
      ascii: `초기 연결 실패 (${this.BOOT_CONNECT_MAX_ATTEMPTS}회 시도) — ${ip}:${port}`,
    });
  }

  onModuleDestroy() {
    if (this.tcpServer) {
      this.tcpServer.close();
      this.tcpServer = null;
    }
    this.teardownOutbound();
    this.logger.log('TCP server closed');
  }

  setIoServer(server: Server) {
    this.ioServer = server;
  }

  // =============================================
  // Network 1: 컨트롤러로 나가는 상시 연결 (lazy connect, 단일 대상)
  // =============================================

  /**
   * 요청된 ip:port로 연결을 재사용하거나, 없으면 새로 connect하여 유지한다.
   * 명령 전송 후 즉시 종료하지 않고 계속 열어둔다 (컨트롤러 포트 점유 이슈 회피).
   */
  private connectOutbound(ip: string, port: number): Promise<net.Socket> {
    if (
      this.outboundSocket &&
      !this.outboundSocket.destroyed &&
      this.outboundTarget?.ip === ip &&
      this.outboundTarget?.port === port
    ) {
      return Promise.resolve(this.outboundSocket);
    }

    if (
      this.outboundConnectPromise &&
      this.outboundTarget?.ip === ip &&
      this.outboundTarget?.port === port
    ) {
      return this.outboundConnectPromise;
    }

    // 대상이 바뀌었거나 기존 연결이 죽어있으면 정리 후 새로 연결
    this.teardownOutbound();
    this.outboundTarget = { ip, port };

    const socket = new net.Socket();

    const connectPromise: Promise<net.Socket> = new Promise<net.Socket>((resolve, reject) => {
      const cleanupListeners = () => {
        socket.off('connect', onConnect);
        socket.off('error', onError);
      };

      const onConnect = () => {
        cleanupListeners();
        this.outboundSocket = socket;
        this.attachOutboundListeners(socket, ip, port);
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `Connected to ${ip}:${port} (상시 연결)`,
        });
        resolve(socket);
      };

      const onError = (err: Error) => {
        cleanupListeners();
        this.logger.error(`Outbound connect error (${ip}:${port}): ${err.message}`);
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `Connect error (${ip}:${port}): ${err.message}`,
        });
        this.outboundTarget = null;
        socket.destroy();
        reject(err);
      };

      socket.once('connect', onConnect);
      socket.once('error', onError);
      socket.connect(port, ip);
    }).finally(() => {
      this.outboundConnectPromise = null;
    });

    this.outboundConnectPromise = connectPromise;
    return connectPromise;
  }

  private attachOutboundListeners(socket: net.Socket, ip: string, port: number) {
    socket.on('data', (data: Buffer) => {
      if (this.dataWatcher) {
        this.dataWatcher(data);
        return;
      }

      const rawHex = data.toString('hex').toUpperCase();
      const hex = rawHex.match(/.{2}/g)?.join(' ') ?? '';
      const ascii = this.tryDecodeAscii(data);

      this.broadcastLog({
        direction: 'RX',
        timestamp: new Date().toISOString(),
        hex,
        ascii,
      });

      const recorderCmd = this.matchRecorderCommand(this.outboundRxBuffer, rawHex);
      if (recorderCmd) {
        this.logger.log(`Recorder command received (outbound): ${recorderCmd}`);
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `Recorder command: ${recorderCmd}`,
        });

        this.handleRecorderCommand(recorderCmd).catch((err) => {
          this.logger.error(`Recorder command failed: ${(err as Error).message}`);
          this.broadcastLog({
            direction: 'SYS',
            timestamp: new Date().toISOString(),
            hex: '',
            ascii: `녹화 연동 실패: ${(err as Error).message}`,
          });
        });
      }

      const resolver = this.pendingResolvers.shift();
      resolver?.(data);
    });

    socket.on('close', () => {
      this.logger.log(`Outbound connection closed (${ip}:${port})`);
      this.broadcastLog({
        direction: 'SYS',
        timestamp: new Date().toISOString(),
        hex: '',
        ascii: `Disconnected from ${ip}:${port}`,
      });

      if (this.outboundSocket === socket) {
        this.outboundSocket = null;
        this.outboundTarget = null;
      }

      this.flushPendingResolvers(null);
      this.dataWatcher = null;

      const closedCb = this.onOutboundClosed;
      this.onOutboundClosed = null;
      closedCb?.();
    });

    socket.on('error', (err: Error) => {
      this.logger.error(`Outbound socket error (${ip}:${port}): ${err.message}`);
      this.broadcastLog({
        direction: 'SYS',
        timestamp: new Date().toISOString(),
        hex: '',
        ascii: `Error: ${err.message}`,
      });
    });
  }

  private flushPendingResolvers(data: Buffer | null) {
    const resolvers = this.pendingResolvers;
    this.pendingResolvers = [];
    resolvers.forEach((resolve) => resolve(data));
  }

  private teardownOutbound() {
    if (this.outboundSocket) {
      this.outboundSocket.removeAllListeners();
      this.outboundSocket.destroy();
    }
    this.outboundSocket = null;
    this.outboundTarget = null;
    this.outboundConnectPromise = null;
    this.dataWatcher = null;
    this.flushPendingResolvers(null);
    this.onOutboundClosed = null;
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

      const rxBuffer: { value: string } = { value: '' };

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

        const recorderCmd = this.matchRecorderCommand(rxBuffer, rawHex);
        if (recorderCmd) {
          this.logger.log(`Recorder command received: ${recorderCmd}`);
          this.broadcastLog({
            direction: 'SYS',
            timestamp: new Date().toISOString(),
            hex: '',
            ascii: `Recorder command: ${recorderCmd}`,
          });

          // RecorderControlService로 녹화 시작/정지 (recorder/control 동일 로직)
          this.handleRecorderCommand(recorderCmd).catch((err) => {
            this.logger.error(`Recorder command failed: ${(err as Error).message}`);
            this.broadcastLog({
              direction: 'SYS',
              timestamp: new Date().toISOString(),
              hex: '',
              ascii: `녹화 연동 실패: ${(err as Error).message}`,
            });
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

    let socket: net.Socket;
    try {
      socket = await this.connectOutbound(ip, port);
    } catch {
      return null;
    }

    socket.write(txBuffer);
    this.broadcastLog({
      direction: 'TX',
      timestamp: new Date().toISOString(),
      hex: txHex,
      ascii: label,
      label,
    });

    if (!waitForResponse) {
      return null;
    }

    return new Promise((resolve) => {
      let settled = false;

      const finish = (result: { hex: string; ascii: string } | null) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      const timeout = setTimeout(() => {
        const idx = this.pendingResolvers.indexOf(resolver);
        if (idx !== -1) this.pendingResolvers.splice(idx, 1);
        this.broadcastLog({
          direction: 'SYS',
          timestamp: new Date().toISOString(),
          hex: '',
          ascii: `Timeout waiting for response from ${ip}:${port}`,
        });
        finish(null);
      }, this.RESPONSE_TIMEOUT_MS);

      const resolver = (data: Buffer | null) => {
        clearTimeout(timeout);
        if (!data) {
          finish(null);
          return;
        }
        const rawHex = data.toString('hex').toUpperCase();
        const ascii = this.tryDecodeAscii(data);
        finish({ hex: rawHex, ascii });
      };

      this.pendingResolvers.push(resolver);
    });
  }

  async sendNfcSequence(ip: string, port: number): Promise<'save' | 'no' | 'timeout'> {
    const NFC_PAGE_HEX = 'EEB111001B03E6100100FFFCFFFF';
    const MAIN_PAGE_HEX = 'EEB111000103E6100100FFFCFFFF';

    const cleaned = NFC_PAGE_HEX.replace(/\s+/g, '');
    const txBuffer = Buffer.from(cleaned, 'hex');
    const txHex = cleaned.toUpperCase().match(/.{2}/g)?.join(' ') ?? '';

    let socket: net.Socket;
    try {
      socket = await this.connectOutbound(ip, port);
    } catch {
      return 'timeout';
    }

    return new Promise((resolve) => {
      let resolved = false;

      const finish = (result: 'save' | 'no' | 'timeout') => {
        if (resolved) return;
        resolved = true;
        this.activeNfcAbort = null;
        this.dataWatcher = null;
        this.onOutboundClosed = null;
        resolve(result);
      };

      this.onOutboundClosed = () => finish('timeout');

      this.activeNfcAbort = () => {
        clearTimeout(timeout);
        if (!socket.destroyed && socket.writable) {
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
        if (!socket.destroyed && socket.writable) {
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

      this.dataWatcher = (data: Buffer) => {
        const rawHex = data.toString('hex').toUpperCase();
        const hex = rawHex.match(/.{2}/g)?.join(' ') ?? '';
        const ascii = this.tryDecodeAscii(data);

        const normalized = rawHex.replace(/\s/g, '');

        const rxLabel =
          normalized === '4E66632073617665'
            ? 'RX: SAVE'
            : normalized === '4E6663206E6F'
              ? 'RX: NO'
              : normalized === MAIN_PAGE_HEX
                ? 'RX: MAIN 페이지'
                : undefined;

        this.broadcastLog({
          direction: 'RX',
          timestamp: new Date().toISOString(),
          hex,
          ascii,
          label: rxLabel,
        });

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

        const result: 'save' | 'no' = normalized === '4E66632073617665' ? 'save' : 'no';

        setTimeout(() => finish(result), 300);
      };

      socket.write(txBuffer);
      this.broadcastLog({
        direction: 'TX',
        timestamp: new Date().toISOString(),
        hex: txHex,
        ascii: 'NFC 페이지 전환',
        label: 'NFC 페이지 전환',
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

  /**
   * 수신 hex를 커넥션별 누적 버퍼에 더한 뒤 RECORDER_COMMANDS 패턴을 찾는다.
   * TCP 조각화로 명령어가 여러 data 이벤트에 걸쳐 나뉘어 들어와도 인식 가능하도록 함.
   */
  private matchRecorderCommand(buffer: { value: string }, rawHex: string): string | null {
    buffer.value = (buffer.value + rawHex).slice(-this.RX_BUFFER_MAX_LEN);

    for (const [key, command] of Object.entries(this.RECORDER_COMMANDS)) {
      const idx = buffer.value.indexOf(key);
      if (idx !== -1) {
        buffer.value = buffer.value.slice(idx + key.length);
        return command;
      }
    }
    return null;
  }

  /**
   * 컨트롤러 RECODER ON/OFF → RecorderControlService 녹화 시작/정지
   * recorder/control 페이지에서 녹화 시작/종료와 동일한 프로세스
   */
  private async handleRecorderCommand(command: string) {
    // space_seq=1 공간의 녹화기 조회
    const recorder = await this.recorderRepo.findOne({
      where: { spaceSeq: 1, recorderIsdel: 'N' },
    });

    if (!recorder) {
      this.broadcastLog({
        direction: 'SYS',
        timestamp: new Date().toISOString(),
        hex: '',
        ascii: '녹화 연동 실패: 매핑된 녹화기 없음',
      });
      return;
    }

    if (command === 'RECORDER ON') {
      this.broadcastLog({
        direction: 'SYS',
        timestamp: new Date().toISOString(),
        hex: '',
        ascii: `녹화 시작 요청: ${recorder.recorderName}`,
      });

      const result = await this.recorderControlService.startRecording(recorder.recorderSeq, {
        sessionTitle: `${this.formatSessionTimestamp()} 컨트롤러 자동 녹화`,
      });

      this.broadcastLog({
        direction: 'SYS',
        timestamp: new Date().toISOString(),
        hex: '',
        ascii: `녹화 시작 완료: ${result.message} (session: ${result.recSessionSeq})`,
      });
    } else if (command === 'RECORDER OFF') {
      this.broadcastLog({
        direction: 'SYS',
        timestamp: new Date().toISOString(),
        hex: '',
        ascii: `녹화 정지 요청: ${recorder.recorderName}`,
      });

      const result = await this.recorderControlService.stopRecording(recorder.recorderSeq);

      this.broadcastLog({
        direction: 'SYS',
        timestamp: new Date().toISOString(),
        hex: '',
        ascii: `녹화 정지 완료: ${result.message}`,
      });
    }
  }

  private formatSessionTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = now.getFullYear();
    const m = pad(now.getMonth() + 1);
    const d = pad(now.getDate());
    const h = pad(now.getHours());
    const min = pad(now.getMinutes());
    return `${y}-${m}-${d} ${h}:${min}`;
  }

  private tryDecodeAscii(buffer: Buffer): string {
    const text = buffer.toString('utf8');
    const hasBrokenChars = /[\uFFFD\x00-\x08\x0E-\x1F]/.test(text);
    return hasBrokenChars ? '' : text;
  }
}
