/**
 * 콘텐츠 승인 상태
 */
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * 콘텐츠 승인 통계
 */
export interface ContentApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

/**
 * 콘텐츠 승인 목록 아이템
 */
export interface ContentApprovalItem {
  plc_seq: number;
  building_name: string | null;
  player_name: string | null;
  playlist_name: string;
  content_name: string;
  content_type: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';
  requester_name: string;
  reg_date: string;
  approval_status: ApprovalStatus;
  reviewer_name: string | null;
  reviewed_date: string | null;
  reject_reason: string | null;
}

/**
 * 콘텐츠 승인 목록 응답
 */
export interface ContentApprovalListResponse {
  items: ContentApprovalItem[];
  stats: ContentApprovalStats;
}

/**
 * 콘텐츠 승인 이력 아이템
 */
export interface ContentApprovalHistoryItem {
  history_seq: number;
  action: 'APPROVED' | 'REJECTED' | 'CANCELLED';
  actor_name: string;
  reason: string | null;
  created_at: string;
}

/**
 * 콘텐츠 승인 필터
 */
export interface ContentApprovalFilter {
  building_seq?: number;
  status?: ApprovalStatus;
  search?: string;
  start_date?: string;
  end_date?: string;
}
