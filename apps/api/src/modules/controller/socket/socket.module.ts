import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TbSocketCommand } from './entities/tb-socket-command.entity';
import { TbRecorder } from '@modules/recorders/entities/recorder.entity';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { SocketCommandService } from './socket-command.service';
import { SocketCommandController } from './socket-command.controller';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { RecordersModule } from '@modules/recorders/recorders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TbSocketCommand, TbRecorder]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    RecordersModule,
  ],
  controllers: [SocketCommandController],
  providers: [SocketGateway, SocketService, SocketCommandService, WsJwtGuard],
  exports: [SocketService],
})
export class SocketModule {}
