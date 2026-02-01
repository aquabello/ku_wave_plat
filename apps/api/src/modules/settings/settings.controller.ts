import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get application settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @ApiOperation({ summary: 'Update application settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  updateSettings(@Body() settings: any) {
    return this.settingsService.updateSettings(settings);
  }
}
