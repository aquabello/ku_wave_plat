import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class PermissionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '통합 검색 (아이디, 이름, 이메일)', example: 'admin' })
  @IsOptional()
  @IsString()
  search?: string;
}
