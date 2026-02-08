// Activity Log List Item
export interface ActivityLogListItem {
  no: number;
  logSeq: number;
  tuId: string | null;
  tuName: string | null;
  actionName: string | null;
  httpMethod: string;
  requestUrl: string;
  statusCode: number | null;
  durationMs: number | null;
  regDate: string | null;
}

// Activity Log Detail
export interface ActivityLogDetail extends ActivityLogListItem {
  tuSeq: number | null;
  requestBody: Record<string, unknown> | null;
  responseBody: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

// Activity Log List Response
export interface ActivityLogListResponse {
  items: ActivityLogListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Activity Log Query Parameters
export interface ActivityLogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  httpMethod?: string;
  actionName?: string;
  startDate?: string;
  endDate?: string;
}
