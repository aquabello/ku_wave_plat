import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ReaderCommandMappingDto {
  @ApiProperty({ example: 1, description: '공간장비 시퀀스' })
  @IsInt()
  spaceDeviceSeq: number;

  @ApiProperty({
    example: 1,
    required: false,
    nullable: true,
    description: '입실 시 실행할 명령어 시퀀스 (null이면 해당 장비 입실 제어 안함)',
  })
  @IsOptional()
  @IsInt()
  enterCommandSeq?: number | null;

  @ApiProperty({
    example: 2,
    required: false,
    nullable: true,
    description: '퇴실 시 실행할 명령어 시퀀스 (null이면 해당 장비 퇴실 제어 안함)',
  })
  @IsOptional()
  @IsInt()
  exitCommandSeq?: number | null;
}

export class UpdateReaderCommandsDto {
  @ApiProperty({
    type: [ReaderCommandMappingDto],
    required: false,
    description: '명령어 매핑 목록 (빈 배열이면 전체 삭제)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReaderCommandMappingDto)
  mappings?: ReaderCommandMappingDto[];

  @ApiProperty({
    example: false,
    required: false,
    description: 'true이면 호실의 모든 ACTIVE 장비에 대해 POWER_ON/POWER_OFF 자동 매핑',
  })
  @IsOptional()
  @IsBoolean()
  mapAll?: boolean;
}
