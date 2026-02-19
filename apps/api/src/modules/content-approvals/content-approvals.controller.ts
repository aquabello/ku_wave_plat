import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContentApprovalsService } from './content-approvals.service';
import { ListContentApprovalsDto } from './dto/list-content-approvals.dto';
import { RejectContentApprovalDto } from './dto/reject-content-approval.dto';

@ApiTags('Content Approvals')
@Controller('content-approvals')
@ApiBearerAuth()
export class ContentApprovalsController {
  constructor(private readonly contentApprovalsService: ContentApprovalsService) {}

  @Get()
  @ApiOperation({ summary: '콘텐츠 승인 목록 + 통계 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findAll(@Query() query: ListContentApprovalsDto) {
    const result = await this.contentApprovalsService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':plcSeq/approve')
  @ApiOperation({ summary: '콘텐츠 승인' })
  @ApiResponse({ status: 200, description: '승인 성공' })
  @ApiResponse({ status: 400, description: 'PENDING 상태가 아닙니다.' })
  @ApiResponse({ status: 404, description: '콘텐츠 매핑을 찾을 수 없습니다.' })
  async approve(
    @Param('plcSeq', ParseIntPipe) plcSeq: number,
    @Req() req: any,
  ) {
    const userId = req.user?.seq || 1;
    const result = await this.contentApprovalsService.approve(plcSeq, userId);
    return {
      success: true,
      message: '콘텐츠가 승인되었습니다.',
      data: result,
    };
  }

  @Patch(':plcSeq/reject')
  @ApiOperation({ summary: '콘텐츠 반려' })
  @ApiResponse({ status: 200, description: '반려 성공' })
  @ApiResponse({ status: 400, description: 'PENDING 상태가 아닙니다.' })
  @ApiResponse({ status: 404, description: '콘텐츠 매핑을 찾을 수 없습니다.' })
  async reject(
    @Param('plcSeq', ParseIntPipe) plcSeq: number,
    @Body() dto: RejectContentApprovalDto,
    @Req() req: any,
  ) {
    const userId = req.user?.seq || 1;
    const result = await this.contentApprovalsService.reject(plcSeq, dto.reason, userId);
    return {
      success: true,
      message: '콘텐츠가 반려되었습니다.',
      data: result,
    };
  }

  @Patch(':plcSeq/cancel')
  @ApiOperation({ summary: '콘텐츠 승인/반려 취소 (→ PENDING)' })
  @ApiResponse({ status: 200, description: '취소 성공' })
  @ApiResponse({ status: 400, description: '이미 대기 상태입니다.' })
  @ApiResponse({ status: 404, description: '콘텐츠 매핑을 찾을 수 없습니다.' })
  async cancel(
    @Param('plcSeq', ParseIntPipe) plcSeq: number,
    @Req() req: any,
  ) {
    const userId = req.user?.seq || 1;
    const result = await this.contentApprovalsService.cancel(plcSeq, userId);
    return {
      success: true,
      message: '승인/반려가 취소되었습니다.',
      data: result,
    };
  }

  @Get(':plcSeq/history')
  @ApiOperation({ summary: '콘텐츠 승인 이력 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '콘텐츠 매핑을 찾을 수 없습니다.' })
  async findHistory(@Param('plcSeq', ParseIntPipe) plcSeq: number) {
    const result = await this.contentApprovalsService.findHistory(plcSeq);
    return {
      success: true,
      data: result,
    };
  }
}
