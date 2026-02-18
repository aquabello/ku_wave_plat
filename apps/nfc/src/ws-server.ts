import WebSocket, { WebSocketServer } from 'ws';
import {
  NfcAgentConfig,
  NfcWsMessage,
  NfcWsTagEventData,
  NfcWsScanEventData,
  NfcWsReaderEventData,
  NfcWsHeartbeatData,
  NfcTagRequest,
  NfcTagResponse,
} from '@ku/types';
import { logger } from './logger';

export class NfcWsServer {
  private wss: WebSocketServer | null = null;
  private enabled: boolean;
  private port: number;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private startTime: number = Date.now();
  private readerConnected: boolean = false;
  private readerName: string = '';

  constructor(private config: NfcAgentConfig) {
    this.enabled = config.wsEnabled;
    this.port = config.wsPort;
  }

  start(): void {
    if (!this.enabled) {
      logger.info('[WS] WebSocket 비활성화 상태');
      return;
    }

    this.startTime = Date.now();

    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('listening', () => {
      logger.info(`[WS] WebSocket 서버 시작 (port: ${this.port})`);
    });

    this.wss.on('connection', (ws: WebSocket) => {
      logger.info(`[WS] 클라이언트 연결 (총 ${this.getClientCount()}명)`);

      // 접속 즉시 현재 상태 전송
      this.sendInitialState(ws);

      ws.on('error', (err: Error) => {
        logger.error(`[WS] 클라이언트 오류: ${err.message}`);
      });

      ws.on('close', () => {
        logger.info(`[WS] 클라이언트 연결 해제 (총 ${this.getClientCount()}명)`);
      });
    });

    this.wss.on('error', (err: Error) => {
      logger.error(`[WS] 서버 오류: ${err.message}`);
    });

    this.startHeartbeat();
  }

  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.wss) {
      this.wss.clients.forEach((client) => {
        client.close();
      });
      this.wss.close();
      this.wss = null;
      logger.info('[WS] WebSocket 서버 종료');
    }
  }

  broadcastTag(request: NfcTagRequest, response: NfcTagResponse): void {
    const message: NfcWsMessage<NfcWsTagEventData> = {
      event: 'tag',
      timestamp: new Date().toISOString(),
      data: { request, response },
    };
    this.broadcast(message);
  }

  broadcastScan(scanData: NfcWsScanEventData): void {
    const message: NfcWsMessage<NfcWsScanEventData> = {
      event: 'scan',
      timestamp: new Date().toISOString(),
      data: scanData,
    };
    this.broadcast(message);
  }

  broadcastReaderConnected(readerName: string): void {
    const message: NfcWsMessage<NfcWsReaderEventData> = {
      event: 'reader_connected',
      timestamp: new Date().toISOString(),
      data: { readerName },
    };
    this.broadcast(message);
  }

  broadcastReaderDisconnected(readerName: string): void {
    const message: NfcWsMessage<NfcWsReaderEventData> = {
      event: 'reader_disconnected',
      timestamp: new Date().toISOString(),
      data: { readerName },
    };
    this.broadcast(message);
  }

  getClientCount(): number {
    return this.wss?.clients.size ?? 0;
  }

  setReaderConnected(connected: boolean, name?: string): void {
    this.readerConnected = connected;
    if (name) this.readerName = name;
    if (!connected) this.readerName = '';
  }

  /** 새 클라이언트 접속 시 현재 상태 즉시 전송 */
  private sendInitialState(ws: WebSocket): void {
    // 리더기 연결 상태
    if (this.readerConnected && this.readerName) {
      const readerMsg: NfcWsMessage<NfcWsReaderEventData> = {
        event: 'reader_connected',
        timestamp: new Date().toISOString(),
        data: { readerName: this.readerName },
      };
      ws.send(JSON.stringify(readerMsg));
    }

    // heartbeat (현재 상태 스냅샷)
    const heartbeatMsg: NfcWsMessage<NfcWsHeartbeatData> = {
      event: 'heartbeat',
      timestamp: new Date().toISOString(),
      data: {
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        connectedClients: this.getClientCount(),
        readerConnected: this.readerConnected,
      },
    };
    ws.send(JSON.stringify(heartbeatMsg));

    logger.debug(`[WS] 초기 상태 전송 (reader: ${this.readerConnected ? this.readerName : 'N/A'})`);
  }

  private broadcast<T>(message: NfcWsMessage<T>): void {
    if (!this.wss) return;

    const payload = JSON.stringify(message);
    let sent = 0;

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        sent++;
      }
    });

    if (sent > 0) {
      logger.debug(`[WS] ${message.event} 이벤트 브로드캐스트 (${sent}명)`);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const message: NfcWsMessage<NfcWsHeartbeatData> = {
        event: 'heartbeat',
        timestamp: new Date().toISOString(),
        data: {
          uptime: Math.floor((Date.now() - this.startTime) / 1000),
          connectedClients: this.getClientCount(),
          readerConnected: this.readerConnected,
        },
      };
      this.broadcast(message);
    }, 30000);
  }
}
