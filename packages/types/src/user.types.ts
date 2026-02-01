/**
 * 사용자 역할
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  VIEWER = 'viewer',
}

/**
 * 사용자 엔티티
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 사용자 생성 DTO
 */
export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

/**
 * 사용자 수정 DTO
 */
export interface UpdateUserDto {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

/**
 * 사용자 목록 필터
 */
export interface UserFilter {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}
