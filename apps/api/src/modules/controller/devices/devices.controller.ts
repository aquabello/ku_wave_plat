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
import { DevicesService } from './devices.service';
import { CreateDeviceDto, CreateBulkDeviceDto, UpdateDeviceDto, DeviceQueryDto, DeviceListResponseDto } from './dto';

@ApiTags('controller - control - devices')
@ApiBearerAuth()
@Controller('controller/control/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: '장비 리스트 조회 (건물별, 공간별 필터, 페이징)' })
  @ApiResponse({
    status: 200,
    description: '장비 리스트 조회 성공',
    type: DeviceListResponseDto,
  })
  @ApiResponse({ status: 404, description: '해당 건물을 찾을 수 없습니다' })
  findAll(@Query() query: DeviceQueryDto) {
    return this.devicesService.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '장비 등록' })
  @ApiResponse({ status: 201, description: '장비가 등록되었습니다' })
  @ApiResponse({ status: 404, description: '해당 공간을 찾을 수 없습니다' })
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '장비 일괄 등록 (하나의 프리셋으로 여러 공간에 등록)' })
  @ApiResponse({ status: 201, description: '일괄 등록 결과' })
  @ApiResponse({ status: 404, description: '해당 프리셋을 찾을 수 없습니다' })
  @ApiResponse({ status: 400, description: 'devices 배열이 비어있습니다' })
  createBulk(@Body() dto: CreateBulkDeviceDto) {
    return this.devicesService.createBulk(dto);
  }

  @Put(':spaceDeviceSeq')
  @ApiOperation({ summary: '장비 수정' })
  @ApiParam({ name: 'spaceDeviceSeq', description: '공간장비 시퀀스', example: 1, type: Number })
  @ApiResponse({ status: 200, description: '장비가 수정되었습니다' })
  @ApiResponse({ status: 404, description: '해당 장비를 찾을 수 없습니다' })
  update(
    @Param('spaceDeviceSeq', ParseIntPipe) spaceDeviceSeq: number,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(spaceDeviceSeq, updateDeviceDto);
  }

  @Delete(':spaceDeviceSeq')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '장비 삭제 (소프트 삭제)' })
  @ApiParam({ name: 'spaceDeviceSeq', description: '공간장비 시퀀스', example: 1, type: Number })
  @ApiResponse({
    status: 200,
    description: '장비가 삭제되었습니다',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '장비가 삭제되었습니다' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '해당 장비를 찾을 수 없습니다' })
  async remove(@Param('spaceDeviceSeq', ParseIntPipe) spaceDeviceSeq: number) {
    await this.devicesService.softDelete(spaceDeviceSeq);
    return { message: '장비가 삭제되었습니다' };
  }
}
