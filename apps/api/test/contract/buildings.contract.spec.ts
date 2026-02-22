/**
 * Buildings API Contract Test
 *
 * 검증 대상:
 * - GET /buildings → PaginatedResponse<BuildingListItem> 스키마
 *
 * 이 테스트가 실패하면 = FE 건물 관리 화면이 깨집니다.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  ApiSuccessSchema,
  BuildingListResponseSchema,
  ApiErrorResponseSchema,
} from '@ku/contracts';
import {
  setupTestApp,
  expectMatchesSchema,
  expectSuccessResponse,
  expectErrorResponse,
} from './contract-helper';

describe('Buildings Contract Tests', () => {
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
  // GET /buildings
  // =============================================

  describe('GET /api/v1/buildings', () => {
    it('응답이 BuildingListResponse 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/buildings')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expectSuccessResponse(res.body);

      const schema = ApiSuccessSchema(BuildingListResponseSchema);
      expectMatchesSchema(res.body, schema, 'GET /buildings');
    });

    it('인증 없이 요청 시 401 에러 스키마가 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/buildings')
        .expect(401);

      expectErrorResponse(res.body, 'UNAUTHORIZED');
      expectMatchesSchema(res.body, ApiErrorResponseSchema, 'GET /buildings (no auth)');
    });
  });
});
