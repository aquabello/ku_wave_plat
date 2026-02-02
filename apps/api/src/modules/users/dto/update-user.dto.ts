import { IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: '이름',
    example: '홍길동',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: '이름은 문자열이어야 합니다' })
  @MaxLength(50, { message: '이름은 최대 50자까지 입력 가능합니다' })
  name?: string;

  @ApiProperty({
    description: '휴대폰 번호',
    example: '010-1234-5678',
    maxLength: 15,
    required: false,
  })
  @IsOptional()
  @IsString({ message: '휴대폰 번호는 문자열이어야 합니다' })
  @MaxLength(15, { message: '휴대폰 번호는 최대 15자까지 입력 가능합니다' })
  phone?: string;

  @ApiProperty({
    description: '이메일',
    example: 'user@example.com',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  @MaxLength(50, { message: '이메일은 최대 50자까지 입력 가능합니다' })
  email?: string;
}
