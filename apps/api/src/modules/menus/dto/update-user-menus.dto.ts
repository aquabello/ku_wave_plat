import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class UpdateUserMenusDto {
  @ApiProperty({
    description: '할당할 메뉴 시퀀스 배열 (GNB + LNB 모두 포함)',
    example: [1, 11, 12, 6, 61, 62],
    type: [Number],
  })
  @IsArray({ message: '메뉴 시퀀스 배열이 필요합니다' })
  @IsInt({ each: true, message: '메뉴 시퀀스는 정수여야 합니다' })
  menuSeqs: number[];
}
