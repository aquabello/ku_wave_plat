import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FtpService } from './ftp.service';
import { CreateFtpConfigDto } from './dto/create-ftp-config.dto';
import { UpdateFtpConfigDto } from './dto/update-ftp-config.dto';

@ApiTags('FTP 설정')
@ApiBearerAuth()
@Controller('ftp-configs')
export class FtpController {
  constructor(private readonly ftpService: FtpService) {}

  @Get()
  @ApiOperation({ summary: 'FTP 설정 목록 조회' })
  async findAll() {
    const result = await this.ftpService.findAll();
    return { success: true, data: result };
  }

  @Post()
  @ApiOperation({ summary: 'FTP 설정 등록' })
  async create(@Body() dto: CreateFtpConfigDto) {
    const result = await this.ftpService.create(dto);
    return { success: true, data: result };
  }

  @Put(':ftpConfigSeq')
  @ApiOperation({ summary: 'FTP 설정 수정' })
  async update(
    @Param('ftpConfigSeq', ParseIntPipe) ftpConfigSeq: number,
    @Body() dto: UpdateFtpConfigDto,
  ) {
    const result = await this.ftpService.update(ftpConfigSeq, dto);
    return { success: true, data: result };
  }

  @Delete(':ftpConfigSeq')
  @ApiOperation({ summary: 'FTP 설정 삭제' })
  async remove(@Param('ftpConfigSeq', ParseIntPipe) ftpConfigSeq: number) {
    const result = await this.ftpService.remove(ftpConfigSeq);
    return { success: true, data: result };
  }

  @Post(':ftpConfigSeq/test')
  @ApiOperation({ summary: 'FTP 연결 테스트' })
  async testConnection(@Param('ftpConfigSeq', ParseIntPipe) ftpConfigSeq: number) {
    const result = await this.ftpService.testConnection(ftpConfigSeq);
    return { success: true, data: result };
  }
}
