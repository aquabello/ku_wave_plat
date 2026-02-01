/**
 * 대시보드 통계
 */
export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  userGrowth: number; // 전월 대비 성장률 (%)
  orderGrowth: number;
  revenueGrowth: number;
  customerGrowth: number;
}

/**
 * 매출 데이터
 */
export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

/**
 * 상위 상품
 */
export interface TopProduct {
  productId: string;
  productName: string;
  totalSales: number;
  totalRevenue: number;
}

/**
 * 주문 상태 통계
 */
export interface OrderStatusStats {
  status: string;
  count: number;
  percentage: number;
}

/**
 * 기간 옵션
 */
export enum PeriodOption {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

/**
 * 대시보드 데이터 요청 DTO
 */
export interface DashboardDataDto {
  period?: PeriodOption;
  startDate?: string;
  endDate?: string;
}
