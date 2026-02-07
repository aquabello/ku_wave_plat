/**
 * 사용자 리스트 아이템 (GET /api/v1/users 응답)
 */
export interface UserListItem {
  no: number;
  seq: number;
  id: string | null;
  name: string | null;
  lastAccessDate: string | null;
  step: string | null;
  approvedDate: string | null;
}

/**
 * 사용자 리스트 응답 (페이징)
 */
export interface UserListResponse {
  items: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 회원 등록 요청 DTO (POST /api/v1/users)
 */
export interface CreateUserDto {
  id: string;
  name: string;
}

/**
 * 회원 수정 요청 DTO (PUT /api/v1/users/:seq)
 */
export interface UpdateUserDto {
  name?: string;
  step?: string;
}

/**
 * 비밀번호 초기화 요청 DTO (PATCH /api/v1/users/:seq/reset-password)
 */
export interface ResetPasswordDto {
  newPassword: string;
}
