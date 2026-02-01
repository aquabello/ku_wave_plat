import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Get sales analytics' })
  @ApiResponse({ status: 200, description: 'Sales data retrieved successfully' })
  getSalesAnalytics(@Query('period') period?: string) {
    return this.analyticsService.getSalesAnalytics(period);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  getUserAnalytics(@Query('period') period?: string) {
    return this.analyticsService.getUserAnalytics(period);
  }
}
