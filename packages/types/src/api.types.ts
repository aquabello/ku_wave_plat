/**
 * API 공통 응답 래퍼
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: ApiError;
}

/**
 * 페이지네이션 메타 정보
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * API 에러
 */
export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
  path?: string;
  details?: any;
}

/**
 * 페이지네이션 쿼리 DTO
 */
export interface PaginationDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 검색 필터 DTO
 */
export interface SearchDto {
  search?: string;
  startDate?: string;
  endDate?: string;
}
