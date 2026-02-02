/**
 * 로그인 요청 DTO
 */
export interface LoginDto {
  id: string;
  password: string;
}

/**
 * 로그인 응답
 */
export interface LoginResponse {
  accessToken: string;
  user: {
    seq: number;
    id: string;
    name: string;
    email: string;
    type: string;
    step: string;
  };
}

/**
 * JWT 페이로드
 */
export interface JwtPayload {
  sub: number;
  id: string;
  type: string;
  iat?: number;
  exp?: number;
}

/**
 * 현재 사용자 (인증된 사용자)
 */
export interface CurrentUser {
  seq: number;
  id: string;
  name: string;
  email: string;
  type: string;
  step: string;
}
