import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: '새 비밀번호',
    example: 'newPassword123!',
    minLength: 8,
    maxLength: 100,
  })
  @IsNotEmpty({ message: '새 비밀번호는 필수입니다' })
  @IsString({ message: '새 비밀번호는 문자열이어야 합니다' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @MaxLength(100, { message: '비밀번호는 최대 100자까지 입력 가능합니다' })
  newPassword: string;
}
