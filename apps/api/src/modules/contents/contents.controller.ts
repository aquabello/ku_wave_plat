import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContentsService } from './contents.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ListContentsDto } from './dto/list-contents.dto';

@ApiTags('Contents')
@ApiBearerAuth()
@Controller('contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  @ApiOperation({ summary: '콘텐츠 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findAll(@Query() query: ListContentsDto) {
    const result = await this.contentsService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':content_seq')
  @ApiOperation({ summary: '콘텐츠 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠를 찾을 수 없습니다.' })
  async findOne(@Param('content_seq', ParseIntPipe) contentSeq: number) {
    const result = await this.contentsService.findOne(contentSeq);
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  @ApiOperation({ summary: '콘텐츠 등록 (파일 업로드)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content_name', 'content_type'],
      properties: {
        content_name: { type: 'string', example: '환영 메시지' },
        content_code: { type: 'string', example: 'CONTENT-001', description: '미입력 시 자동 생성' },
        content_type: { type: 'string', enum: ['VIDEO', 'IMAGE', 'HTML', 'STREAM'] },
        file: { type: 'string', format: 'binary', description: '업로드 파일 (VIDEO/IMAGE/HTML)' },
        content_url: { type: 'string', example: 'https://stream.example.com/video.m3u8' },
        content_duration: { type: 'integer', example: 30 },
        content_description: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '등록 성공' })
  @ApiResponse({ status: 400, description: '유효성 검증 실패' })
  @ApiResponse({ status: 409, description: '중복된 콘텐츠 코드' })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createContentDto: CreateContentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.contentsService.create(createContentDto, file);
    return {
      success: true,
      message: '콘텐츠가 등록되었습니다.',
      data: result,
    };
  }

  @Put(':content_seq')
  @ApiOperation({ summary: '콘텐츠 수정' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content_name: { type: 'string' },
        content_type: { type: 'string', enum: ['VIDEO', 'IMAGE', 'HTML', 'STREAM'] },
        file: { type: 'string', format: 'binary', description: '파일 교체' },
        content_url: { type: 'string' },
        content_duration: { type: 'integer' },
        content_description: { type: 'string' },
        content_order: { type: 'integer' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠를 찾을 수 없습니다.' })
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('content_seq', ParseIntPipe) contentSeq: number,
    @Body() updateContentDto: UpdateContentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.contentsService.update(contentSeq, updateContentDto, file);
    return {
      success: true,
      message: '콘텐츠가 수정되었습니다.',
      data: result,
    };
  }

  @Delete(':content_seq')
  @ApiOperation({ summary: '콘텐츠 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠를 찾을 수 없습니다.' })
  async remove(@Param('content_seq', ParseIntPipe) contentSeq: number) {
    await this.contentsService.remove(contentSeq);
    return {
      success: true,
      message: '콘텐츠가 삭제되었습니다.',
    };
  }
}
