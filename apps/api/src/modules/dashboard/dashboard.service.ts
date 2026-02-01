import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  async getOverview() {
    // TODO: Implement actual dashboard data aggregation
    return {
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
    };
  }
}
