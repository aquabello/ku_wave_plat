import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, UserQueryDto, UserListResponseDto } from './dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '사용자 리스트 조회 (페이징)' })
  @ApiResponse({
    status: 200,
    description: '사용자 리스트 조회 성공',
    type: UserListResponseDto,
  })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':seq')
  @ApiOperation({ summary: '사용자 상세 조회' })
  @ApiParam({ name: 'seq', description: '사용자 시퀀스', example: 1, type: Number })
  @ApiResponse({ status: 200, description: '사용자 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '해당 회원을 찾을 수 없습니다' })
  async findOne(@Param('seq', ParseIntPipe) seq: number) {
    const user = await this.usersService.findBySeq(seq);
    if (!user) {
      throw new NotFoundException('해당 회원을 찾을 수 없습니다');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '회원 등록' })
  @ApiResponse({ status: 201, description: '회원이 등록되었습니다' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 아이디입니다' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
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
