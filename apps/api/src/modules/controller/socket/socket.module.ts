import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TbSocketCommand } from './entities/tb-socket-command.entity';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { SocketCommandService } from './socket-command.service';
import { SocketCommandController } from './socket-command.controller';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([TbSocketCommand]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SocketCommandController],
  providers: [SocketGateway, SocketService, SocketCommandService, WsJwtGuard],
  exports: [SocketService],
})
export class SocketModule {}
