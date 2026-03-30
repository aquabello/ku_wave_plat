import apiClient from './client';

export interface DashboardOverview {
  controller: { total: number; active: number; inactive: number };
  nfc: { totalCards: number; todayTagCount: number };
  display: { total: number; online: number; offline: number };
  users: { total: number; active: number };
  recordingsByDay: Array<{ date: string; count: number }>;
  recentActivities: Array<{
    actionName: string;
    userName: string | null;
    httpMethod: string;
    requestUrl: string;
    statusCode: number | null;
    regDate: string;
  }>;
  displayContents: Array<{
    contentName: string;
    contentType: string;
    contentStatus: string;
    validFrom: string | null;
    validTo: string | null;
  }>;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  return await apiClient<DashboardOverview>('/dashboard/overview');
}
