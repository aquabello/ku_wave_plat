import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateSocketCommandDto {
  @IsString()
  @IsNotEmpty()
  cmdLabel: string;

  @IsString()
  @IsNotEmpty()
  cmdHex: string;

  @IsString()
  @IsNotEmpty()
  cmdCategory: string;

  @IsOptional()
  @IsString()
  cmdDescription?: string;

  @IsOptional()
  @IsInt()
  cmdOrder?: number;
}
