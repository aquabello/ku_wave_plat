import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    };
  }
}
