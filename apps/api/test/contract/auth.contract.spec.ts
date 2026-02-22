/**
 * Auth API Contract Test
 *
 * 검증 대상:
 * - POST /auth/login → LoginResponse 스키마
 * - POST /auth/refresh → RefreshResponse 스키마
 *
 * 이 테스트가 실패하면 = FE 로그인/인증 흐름이 깨집니다.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  ApiSuccessSchema,
  LoginResponseSchema,
  RefreshResponseSchema,
  ApiErrorResponseSchema,
} from '@ku/contracts';
import {
  setupTestApp,
  expectMatchesSchema,
  expectSuccessResponse,
  expectErrorResponse,
} from './contract-helper';

describe('Auth Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
  });

  afterAll(async () => {
    await app.close();
  });

  // =============================================
  // POST /auth/login
  // =============================================

  describe('POST /api/v1/auth/login', () => {
    it('성공 응답이 LoginResponse 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          tu_email: 'admin@test.com',
          tu_password: 'password123',
        })
        .expect(200);

      // 1. 기본 성공 응답 구조 검증
      expectSuccessResponse(res.body);

      // 2. data 필드가 LoginResponse 스키마와 일치하는지 검증
      const schema = ApiSuccessSchema(LoginResponseSchema);
      expectMatchesSchema(res.body, schema, 'POST /auth/login');
    });

    it('잘못된 비밀번호 시 에러 응답 스키마가 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          tu_email: 'admin@test.com',
          tu_password: 'wrong_password',
        })
        .expect(401);

      // 에러 응답 구조 검증
      expectErrorResponse(res.body, 'UNAUTHORIZED');
      expectMatchesSchema(res.body, ApiErrorResponseSchema, 'POST /auth/login (error)');
    });
  });

  // =============================================
  // POST /auth/refresh
  // =============================================

  describe('POST /api/v1/auth/refresh', () => {
    it('성공 응답이 RefreshResponse 스키마와 일치해야 한다', async () => {
      // 먼저 로그인하여 refreshToken 획득
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          tu_email: 'admin@test.com',
          tu_password: 'password123',
        })
        .expect(200);

      const refreshToken = loginRes.body.data.refreshToken;

      // refresh 요청
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // RefreshResponse 스키마 검증
      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(RefreshResponseSchema);
      expectMatchesSchema(res.body, schema, 'POST /auth/refresh');
    });

    it('잘못된 refreshToken 시 에러 응답 스키마가 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);

      expectErrorResponse(res.body);
      expectMatchesSchema(res.body, ApiErrorResponseSchema, 'POST /auth/refresh (error)');
    });
  });
});
