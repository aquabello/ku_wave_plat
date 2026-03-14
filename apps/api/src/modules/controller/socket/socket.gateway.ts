import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';
import { SocketCommandService } from './socket-command.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { CommandFormat } from './dto/socket-command.dto';

interface JwtPayload {
  sub: number;
  username: string;
  role: string;
}

interface SendCommandPayload {
  ip: string;
  port: number;
  socketCmdSeq: number;
  isTest?: boolean;
}

interface SendManualPayload {
  ip: string;
  port: number;
  manualCommand: string;
  format: CommandFormat;
}

@WebSocketGateway({
  namespace: '/controller-socket',
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private readonly socketService: SocketService,
    private readonly commandService: SocketCommandService,
    private readonly moduleRef: ModuleRef,
  ) {}

  afterInit(server: Server) {
    this.socketService.setIoServer(server);
  }

  async handleConnection(client: Socket) {
    try {
      const jwtService = this.moduleRef.get(JwtService, { strict: false });
      const token =
        (client.handshake.auth?.token as string) ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('WS connection rejected: no token');
        client.disconnect(true);
        return;
      }

      const payload = jwtService.verify<JwtPayload>(token);
      (client as Socket & { user: JwtPayload }).user = payload;

      client.join('controller-socket');
      client.emit('socket:server-status', this.socketService.getServerStatus());

      this.logger.log(`WS client connected: ${client.id} (${payload.username})`);
    } catch (err) {
      this.logger.warn(
        `WS connection rejected: ${(err as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS client disconnected: ${client.id}`);
  }

  @SubscribeMessage('socket:send-command')
  async handleSendCommand(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: SendCommandPayload,
  ) {
    try {
      const command = await this.commandService.findOne(payload.socketCmdSeq);

      if (payload.isTest) {
        this.socketService.simulateRx(command.cmdHex, command.cmdLabel);
        return { event: 'socket:send-command', data: { success: true } };
      }

      const NFC_PAGE_HEX = 'EEB111001B03E6100100FFFCFFFF';
      const normalizedHex = command.cmdHex.replace(/\s/g, '').toUpperCase();

      if (normalizedHex === NFC_PAGE_HEX) {
        const result = await this.socketService.sendNfcSequence(payload.ip, payload.port);
        return {
          event: 'socket:send-command',
          data: { success: true, result },
        };
      }

      const response = await this.socketService.sendOneShot(
        payload.ip,
        payload.port,
        command.cmdHex,
        command.cmdLabel,
        false,
      );
      return {
        event: 'socket:send-command',
        data: { success: true, response },
      };
    } catch (err) {
      return {
        event: 'socket:send-command',
        data: { success: false, error: (err as Error).message },
      };
    }
  }

  @SubscribeMessage('socket:send')
  async handleSocketSend(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: SendCommandPayload & SendManualPayload,
  ) {
    try {
      if (payload.socketCmdSeq) {
        const command = await this.commandService.findOne(payload.socketCmdSeq);
        if (payload.isTest) {
          this.socketService.simulateRx(command.cmdHex, command.cmdLabel);
        } else {
          const NFC_PAGE_HEX = 'EEB111001B03E6100100FFFCFFFF';
          const normalizedHex = command.cmdHex.replace(/\s/g, '').toUpperCase();

          if (normalizedHex === NFC_PAGE_HEX) {
            await this.socketService.sendNfcSequence(payload.ip, payload.port);
          } else {
            await this.socketService.sendOneShot(
              payload.ip,
              payload.port,
              command.cmdHex,
              command.cmdLabel,
              false,
            );
          }
        }
      } else if (payload.manualCommand) {
        await this.socketService.sendManualOneShot(
          payload.ip,
          payload.port,
          payload.manualCommand,
          payload.format,
        );
      }
      return { event: 'socket:send', data: { success: true } };
    } catch (err) {
      return {
        event: 'socket:send',
        data: { success: false, error: (err as Error).message },
      };
    }
  }

  @SubscribeMessage('socket:get-statuses')
  handleGetStatuses() {
    return {
      event: 'socket:server-status',
      data: this.socketService.getServerStatus(),
    };
  }
}
