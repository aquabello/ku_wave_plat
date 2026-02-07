/**
 * 건물 리스트 아이템
 */
export interface BuildingListItem {
  buildingSeq: number;
  buildingName: string;
  buildingCode: string | null;
  buildingLocation: string | null;
  buildingFloorCount: number | null;
  playerCount: number;
  assignedUserCount: number;
}

/**
 * 건물 리스트 응답 (페이징)
 */
export interface BuildingListResponse {
  items: BuildingListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 건물 등록 요청 DTO
 */
export interface CreateBuildingDto {
  buildingName: string;
  buildingLocation?: string;
  buildingFloorCount?: number;
  buildingOrder?: number;
  buildingManagerName?: string;
  buildingManagerPhone?: string;
}

/**
 * 건물 수정 요청 DTO
 */
export interface UpdateBuildingDto {
  buildingName?: string;
  buildingCode?: string;
  buildingLocation?: string;
  buildingFloorCount?: number;
  buildingOrder?: number;
  buildingManagerName?: string;
  buildingManagerPhone?: string;
}
