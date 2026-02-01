import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecureP@ss123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/, {
    message: 'Password must contain letters, numbers, and special characters',
  })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
