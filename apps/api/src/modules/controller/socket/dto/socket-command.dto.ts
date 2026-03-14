import { IsInt, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';

export enum CommandFormat {
  HEX = 'HEX',
  TEXT = 'TEXT',
}

export class SocketSendDto {
  @IsInt()
  spaceSeq: number;

  @IsOptional()
  @IsInt()
  socketCmdSeq?: number;

  @IsOptional()
  @IsString()
  manualCommand?: string;

  @IsEnum(CommandFormat)
  format: CommandFormat;

  @IsOptional()
  @IsBoolean()
  isTest?: boolean;
}
