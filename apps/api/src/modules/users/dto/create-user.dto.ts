import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '아이디', example: 'user01', maxLength: 20 })
  @IsNotEmpty({ message: '아이디는 필수입니다' })
  @IsString({ message: '아이디는 문자열이어야 합니다' })
  @MaxLength(20, { message: '아이디는 최대 20자까지 입력 가능합니다' })
  id: string;

  @ApiProperty({ description: '이름', example: '홍길동', maxLength: 50 })
  @IsNotEmpty({ message: '이름은 필수입니다' })
  @IsString({ message: '이름은 문자열이어야 합니다' })
  @MaxLength(50, { message: '이름은 최대 50자까지 입력 가능합니다' })
  name: string;
}
