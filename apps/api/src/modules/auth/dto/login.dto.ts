import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: '아이디' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'password', description: '비밀번호' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
