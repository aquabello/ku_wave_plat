/**
 * 권한 목록 아이템 (GET /api/v1/permissions 응답)
 */
export interface PermissionListItem {
  no: number;
  seq: number;
  id: string | null;
  name: string | null;
  userType: string | null;
  step: string | null;
  assignedBuildings: string[];
  assignedMenus: string[];
}

/**
 * 권한 목록 응답 (페이징)
 */
export interface PermissionListResponse {
  items: PermissionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
