import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class AssignBuildingsDto {
  @ApiProperty({
    description: '할당할 건물 시퀀스 목록 (빈 배열이면 전체 해제)',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  buildingSeqs: number[];
}
