import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class AddMembersDto {
  @ApiProperty({ example: [1, 2, 3], description: '추가할 플레이어 시퀀스 배열' })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  player_seqs: number[];
}
