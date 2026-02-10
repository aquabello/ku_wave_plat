/**
 * 공간 리스트 아이템
 */
export interface SpaceListItem {
  no: number;
  spaceSeq: number;
  buildingSeq: number;
  spaceName: string;
  spaceCode: string;
  spaceFloor: string | null;
  spaceType: string | null;
  spaceCapacity: number;
  spaceDescription: string | null;
  spaceOrder: number;
}

/**
 * 공간 상세
 */
export interface SpaceDetail {
  spaceSeq: number;
  buildingSeq: number;
  spaceName: string;
  spaceCode: string;
  spaceFloor: string | null;
  spaceType: string | null;
  spaceCapacity: number;
  spaceDescription: string | null;
  spaceOrder: number;
  spaceIsdel: string;
  regDate: string;
  updDate: string;
}

/**
 * 공간 리스트 응답 (페이징)
 */
export interface SpaceListResponse {
  items: SpaceListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 공간 등록 요청 DTO
 */
export interface CreateSpaceDto {
  spaceName: string;
  spaceFloor?: string;
  spaceType?: string;
  spaceCapacity?: number;
  spaceDescription?: string;
  spaceOrder?: number;
}

/**
 * 공간 수정 요청 DTO
 */
export interface UpdateSpaceDto {
  spaceName?: string;
  spaceFloor?: string;
  spaceType?: string;
  spaceCapacity?: number;
  spaceDescription?: string;
  spaceOrder?: number;
}

/**
 * 공간 리스트 쿼리
 */
export interface SpaceListQuery {
  page?: number;
  limit?: number;
  search?: string;
  floor?: string;
  spaceType?: string;
}
