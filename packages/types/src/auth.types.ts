import { UserRole } from './user.types';

/**
 * 로그인 요청 DTO
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * 로그인 응답
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

/**
 * 토큰 갱신 요청 DTO
 */
export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * 토큰 갱신 응답
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * JWT 페이로드
 */
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * 현재 사용자 (인증된 사용자)
 */
export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
}
