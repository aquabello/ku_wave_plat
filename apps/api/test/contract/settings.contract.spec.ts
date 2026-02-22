/**
 * Settings API Contract Test
 *
 * 검증 대상:
 * - GET /settings/system → SettingResponse 스키마
 *
 * 이 테스트가 실패하면 = FE 시스템 설정 화면이 깨집니다.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  ApiSuccessSchema,
  SettingResponseSchema,
  ApiErrorResponseSchema,
} from '@ku/contracts';
import {
  setupTestApp,
  expectMatchesSchema,
  expectSuccessResponse,
  expectErrorResponse,
} from './contract-helper';

describe('Settings Contract Tests', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    token = setup.token;
  });

  afterAll(async () => {
    await app.close();
  });

  // =============================================
  // GET /settings/system
  // =============================================

  describe('GET /api/v1/settings/system', () => {
    it('응답이 SettingResponse 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/settings/system')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expectSuccessResponse(res.body);

      const schema = ApiSuccessSchema(SettingResponseSchema);
      expectMatchesSchema(res.body, schema, 'GET /settings/system');
    });

    it('인증 없이 요청 시 401 에러 스키마가 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/settings/system')
        .expect(401);

      expectErrorResponse(res.body, 'UNAUTHORIZED');
      expectMatchesSchema(res.body, ApiErrorResponseSchema, 'GET /settings/system (no auth)');
    });
  });
});
