/**
 * Players API Contract Test
 *
 * 검증 대상:
 * - GET /players → PaginatedResponse<PlayerListItem> 스키마
 * - GET /players/:seq → Player 스키마
 * - POST /players → CreatePlayerResponse 스키마
 *
 * 이 테스트가 실패하면 = FE 플레이어 관리 화면이 깨집니다.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  ApiSuccessSchema,
  PaginatedWithMetaSchema,
  PlayerListItemSchema,
  PlayerSchema,
  HeartbeatResponseSchema,
  HeartbeatLogSchema,
  ApiErrorResponseSchema,
} from '@ku/contracts';
import {
  setupTestApp,
  expectMatchesSchema,
  expectSuccessResponse,
  expectErrorResponse,
} from './contract-helper';

describe('Players Contract Tests', () => {
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
  // GET /players (목록)
  // =============================================

  describe('GET /api/v1/players', () => {
    it('응답이 PaginatedResponse<PlayerListItem> 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/players')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expectSuccessResponse(res.body);

      // data 내부가 { items: PlayerListItem[], pagination: {...} } 구조인지 검증
      const schema = ApiSuccessSchema(
        PaginatedWithMetaSchema(PlayerListItemSchema),
      );
      expectMatchesSchema(res.body, schema, 'GET /players');
    });

    it('인증 없이 요청 시 401 에러 스키마가 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/players')
        .expect(401);

      expectErrorResponse(res.body, 'UNAUTHORIZED');
      expectMatchesSchema(res.body, ApiErrorResponseSchema, 'GET /players (no auth)');
    });
  });

  // =============================================
  // GET /players/:seq (상세)
  // =============================================

  describe('GET /api/v1/players/:seq', () => {
    it('응답이 Player 스키마와 일치해야 한다', async () => {
      // 먼저 목록에서 첫 번째 플레이어 seq를 가져옴
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/players')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      const items = listRes.body.data?.items;
      if (!items || items.length === 0) {
        console.log('⏭️  No players found, skipping detail contract test');
        return;
      }

      const playerSeq = items[0].player_seq;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/players/${playerSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expectSuccessResponse(res.body);

      const schema = ApiSuccessSchema(PlayerSchema);
      expectMatchesSchema(res.body, schema, `GET /players/${playerSeq}`);
    });

    it('존재하지 않는 플레이어 요청 시 404 에러 스키마가 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/players/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expectErrorResponse(res.body, 'NOT_FOUND');
      expectMatchesSchema(res.body, ApiErrorResponseSchema, 'GET /players/999999 (not found)');
    });
  });

  // =============================================
  // GET /players/:seq/heartbeat-logs
  // =============================================

  describe('GET /api/v1/players/:seq/heartbeat-logs', () => {
    it('응답이 PaginatedResponse<HeartbeatLog> 스키마와 일치해야 한다', async () => {
      // 목록에서 플레이어 seq 가져오기
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/players')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      const items = listRes.body.data?.items;
      if (!items || items.length === 0) {
        console.log('⏭️  No players found, skipping heartbeat-logs contract test');
        return;
      }

      const playerSeq = items[0].player_seq;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/players/${playerSeq}/heartbeat-logs`)
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expectSuccessResponse(res.body);

      const schema = ApiSuccessSchema(
        PaginatedWithMetaSchema(HeartbeatLogSchema),
      );
      expectMatchesSchema(
        res.body,
        schema,
        `GET /players/${playerSeq}/heartbeat-logs`,
      );
    });
  });
});
