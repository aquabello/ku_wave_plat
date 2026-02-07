import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class UserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '통합 검색 (아이디, 이름, 이메일)', example: '홍길동' })
  @IsOptional()
  @IsString()
  search?: string;
}
