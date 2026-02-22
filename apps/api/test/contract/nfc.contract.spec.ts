/**
 * NFC API Contract Test
 *
 * 검증 대상:
 * - GET  /nfc/readers      → PaginatedResponse<NfcReaderListItem>
 * - GET  /nfc/readers/:seq → NfcReaderDetail
 * - GET  /nfc/readers/:seq/commands → NfcReaderCommandMapping
 * - GET  /nfc/cards        → PaginatedResponse<NfcCardListItem>
 * - GET  /nfc/cards/:seq   → NfcCardDetail
 * - GET  /nfc/cards/unregistered → PaginatedResponse<UnregisteredTagItem>
 * - GET  /nfc/logs         → PaginatedResponse<NfcLogListItem>
 * - GET  /nfc/logs/:seq    → NfcLogDetail
 * - GET  /nfc/stats        → NfcStats
 *
 * 이 테스트가 실패하면 = FE NFC/RFID 관리 화면이 깨집니다.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  ApiSuccessSchema,
  NfcReaderListResponseSchema,
  NfcReaderDetailSchema,
  NfcReaderCommandMappingSchema,
  NfcCardListResponseSchema,
  NfcCardDetailSchema,
  UnregisteredTagItemSchema,
  NfcLogListResponseSchema,
  NfcLogDetailSchema,
  NfcStatsSchema,
  ApiErrorResponseSchema,
  PaginatedSchema,
} from '@ku/contracts';
import {
  setupTestApp,
  expectMatchesSchema,
  expectSuccessResponse,
  expectErrorResponse,
} from './contract-helper';

describe('NFC Contract Tests', () => {
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
  // NFC Readers
  // =============================================

  describe('GET /api/v1/nfc/readers', () => {
    it('응답이 NfcReaderListResponse 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/nfc/readers')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(NfcReaderListResponseSchema);
      expectMatchesSchema(res.body, schema, 'GET /nfc/readers');
    });
  });

  describe('GET /api/v1/nfc/readers/:readerSeq', () => {
    it('응답이 NfcReaderDetail 스키마와 일치해야 한다', async () => {
      // 목록에서 첫 번째 reader seq 가져오기
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/nfc/readers')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      const items = listRes.body.data?.items;
      if (!items || items.length === 0) {
        console.log('⏭️  No NFC readers found, skipping detail contract test');
        return;
      }

      const readerSeq = items[0].readerSeq;
      const res = await request(app.getHttpServer())
        .get(`/api/v1/nfc/readers/${readerSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(NfcReaderDetailSchema);
      expectMatchesSchema(res.body, schema, `GET /nfc/readers/${readerSeq}`);
    });

    it('존재하지 않는 reader 요청 시 404 에러 스키마가 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/nfc/readers/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expectErrorResponse(res.body, 'NOT_FOUND');
      expectMatchesSchema(res.body, ApiErrorResponseSchema, 'GET /nfc/readers/999999');
    });
  });

  describe('GET /api/v1/nfc/readers/:readerSeq/commands', () => {
    it('응답이 NfcReaderCommandMapping 스키마와 일치해야 한다', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/nfc/readers')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      const items = listRes.body.data?.items;
      if (!items || items.length === 0) {
        console.log('⏭️  No NFC readers found, skipping commands contract test');
        return;
      }

      const readerSeq = items[0].readerSeq;
      const res = await request(app.getHttpServer())
        .get(`/api/v1/nfc/readers/${readerSeq}/commands`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(NfcReaderCommandMappingSchema);
      expectMatchesSchema(res.body, schema, `GET /nfc/readers/${readerSeq}/commands`);
    });
  });

  // =============================================
  // NFC Cards
  // =============================================

  describe('GET /api/v1/nfc/cards', () => {
    it('응답이 NfcCardListResponse 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/nfc/cards')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(NfcCardListResponseSchema);
      expectMatchesSchema(res.body, schema, 'GET /nfc/cards');
    });
  });

  describe('GET /api/v1/nfc/cards/:cardSeq', () => {
    it('응답이 NfcCardDetail 스키마와 일치해야 한다', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/nfc/cards')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      const items = listRes.body.data?.items;
      if (!items || items.length === 0) {
        console.log('⏭️  No NFC cards found, skipping detail contract test');
        return;
      }

      const cardSeq = items[0].cardSeq;
      const res = await request(app.getHttpServer())
        .get(`/api/v1/nfc/cards/${cardSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(NfcCardDetailSchema);
      expectMatchesSchema(res.body, schema, `GET /nfc/cards/${cardSeq}`);
    });
  });

  describe('GET /api/v1/nfc/cards/unregistered', () => {
    it('응답이 PaginatedResponse<UnregisteredTagItem> 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/nfc/cards/unregistered')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(PaginatedSchema(UnregisteredTagItemSchema));
      expectMatchesSchema(res.body, schema, 'GET /nfc/cards/unregistered');
    });
  });

  // =============================================
  // NFC Logs
  // =============================================

  describe('GET /api/v1/nfc/logs', () => {
    it('응답이 NfcLogListResponse 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/nfc/logs')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(NfcLogListResponseSchema);
      expectMatchesSchema(res.body, schema, 'GET /nfc/logs');
    });
  });

  describe('GET /api/v1/nfc/logs/:nfcLogSeq', () => {
    it('응답이 NfcLogDetail 스키마와 일치해야 한다', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/nfc/logs')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      const items = listRes.body.data?.items;
      if (!items || items.length === 0) {
        console.log('⏭️  No NFC logs found, skipping detail contract test');
        return;
      }

      const nfcLogSeq = items[0].nfcLogSeq;
      const res = await request(app.getHttpServer())
        .get(`/api/v1/nfc/logs/${nfcLogSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(NfcLogDetailSchema);
      expectMatchesSchema(res.body, schema, `GET /nfc/logs/${nfcLogSeq}`);
    });
  });

  // =============================================
  // NFC Stats
  // =============================================

  describe('GET /api/v1/nfc/stats', () => {
    it('응답이 NfcStats 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/nfc/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(NfcStatsSchema);
      expectMatchesSchema(res.body, schema, 'GET /nfc/stats');
    });
  });

  // =============================================
  // Auth Guard
  // =============================================

  describe('인증 없이 요청', () => {
    it('GET /nfc/readers → 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/nfc/readers')
        .expect(401);

      expectErrorResponse(res.body, 'UNAUTHORIZED');
    });

    it('GET /nfc/cards → 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/nfc/cards')
        .expect(401);

      expectErrorResponse(res.body, 'UNAUTHORIZED');
    });

    it('GET /nfc/stats → 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/nfc/stats')
        .expect(401);

      expectErrorResponse(res.body, 'UNAUTHORIZED');
    });
  });
});
