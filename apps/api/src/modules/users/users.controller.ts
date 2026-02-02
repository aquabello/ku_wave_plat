import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':seq')
  @ApiOperation({ summary: '회원 정보 업데이트' })
  @ApiParam({
    name: 'seq',
    description: '사용자 시퀀스',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '회원 정보가 성공적으로 업데이트되었습니다',
  })
  @ApiResponse({ status: 404, description: '해당 회원을 찾을 수 없습니다' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청입니다' })
  async updateUser(
    @Param('seq', ParseIntPipe) seq: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(seq, updateUserDto);
  }

  @Patch(':seq/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 초기화' })
  @ApiParam({
    name: 'seq',
    description: '사용자 시퀀스',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '비밀번호가 초기화되었습니다',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '비밀번호가 초기화되었습니다' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '해당 회원을 찾을 수 없습니다' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청입니다' })
  async resetPassword(
    @Param('seq', ParseIntPipe) seq: number,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    await this.usersService.resetPassword(seq, resetPasswordDto);
    return { message: '비밀번호가 초기화되었습니다' };
  }

  @Delete(':seq')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '회원 삭제 (소프트 삭제)' })
  @ApiParam({
    name: 'seq',
    description: '사용자 시퀀스',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '회원이 삭제되었습니다',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '회원이 삭제되었습니다' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '해당 회원을 찾을 수 없습니다' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청입니다' })
  async deleteUser(@Param('seq', ParseIntPipe) seq: number) {
    await this.usersService.softDelete(seq);
    return { message: '회원이 삭제되었습니다' };
  }
}
