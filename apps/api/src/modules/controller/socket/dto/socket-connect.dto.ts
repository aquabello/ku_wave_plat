import { IsInt, IsIP, Min, Max } from 'class-validator';

export class SocketConnectDto {
  @IsInt()
  spaceSeq: number;

  @IsIP()
  ip: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;
}
