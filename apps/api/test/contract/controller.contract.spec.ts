/**
 * Controller API Contract Test
 *
 * 검증 대상:
 * - GET  /controller/presets           → PaginatedResponse<PresetListItem>
 * - GET  /controller/presets/:seq      → PresetDetail
 * - GET  /controller/control/spaces    → ControlSpacesResponse
 * - GET  /controller/control/spaces/:seq/devices → SpaceDevicesResponse
 * - GET  /controller/control/logs      → ControlLogResponse
 * - GET  /controller/control/devices   → PaginatedResponse<DeviceListItem>
 *
 * 이 테스트가 실패하면 = FE 제어관리 화면이 깨집니다.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  ApiSuccessSchema,
  PresetListItemSchema,
  PresetDetailSchema,
  DeviceListItemSchema,
  ControlSpacesResponseSchema,
  SpaceDevicesResponseSchema,
  ControlLogResponseSchema,
  ApiErrorResponseSchema,
  PaginatedSchema,
} from '@ku/contracts';
import {
  setupTestApp,
  expectMatchesSchema,
  expectSuccessResponse,
  expectErrorResponse,
} from './contract-helper';

describe('Controller Contract Tests', () => {
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
  // Presets
  // =============================================

  describe('GET /api/v1/controller/presets', () => {
    it('응답이 PaginatedResponse<PresetListItem> 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/controller/presets')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(PaginatedSchema(PresetListItemSchema));
      expectMatchesSchema(res.body, schema, 'GET /controller/presets');
    });
  });

  describe('GET /api/v1/controller/presets/:presetSeq', () => {
    it('응답이 PresetDetail 스키마와 일치해야 한다', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/controller/presets')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      const items = listRes.body.data?.items;
      if (!items || items.length === 0) {
        console.log('⏭️  No presets found, skipping detail contract test');
        return;
      }

      const presetSeq = items[0].presetSeq;
      const res = await request(app.getHttpServer())
        .get(`/api/v1/controller/presets/${presetSeq}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(PresetDetailSchema);
      expectMatchesSchema(res.body, schema, `GET /controller/presets/${presetSeq}`);
    });

    it('존재하지 않는 preset 요청 시 404 에러 스키마가 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/controller/presets/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expectErrorResponse(res.body, 'NOT_FOUND');
      expectMatchesSchema(res.body, ApiErrorResponseSchema, 'GET /controller/presets/999999');
    });
  });

  // =============================================
  // Devices
  // =============================================

  describe('GET /api/v1/controller/control/devices', () => {
    it('응답이 PaginatedResponse<DeviceListItem> 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/controller/control/devices')
        .set('Authorization', `Bearer ${token}`)
        .query({ buildingSeq: 1, page: 1, limit: 10 })
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(PaginatedSchema(DeviceListItemSchema));
      expectMatchesSchema(res.body, schema, 'GET /controller/control/devices');
    });
  });

  // =============================================
  // Control - Spaces
  // =============================================

  describe('GET /api/v1/controller/control/spaces', () => {
    it('응답이 ControlSpacesResponse 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/controller/control/spaces')
        .set('Authorization', `Bearer ${token}`)
        .query({ buildingSeq: 1 })
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(ControlSpacesResponseSchema);
      expectMatchesSchema(res.body, schema, 'GET /controller/control/spaces');
    });
  });

  describe('GET /api/v1/controller/control/spaces/:spaceSeq/devices', () => {
    it('응답이 SpaceDevicesResponse 스키마와 일치해야 한다', async () => {
      // 먼저 spaces 목록에서 spaceSeq 가져오기
      const spacesRes = await request(app.getHttpServer())
        .get('/api/v1/controller/control/spaces')
        .set('Authorization', `Bearer ${token}`)
        .query({ buildingSeq: 1 })
        .expect(200);

      const spaces = spacesRes.body.data?.spaces;
      if (!spaces || spaces.length === 0) {
        console.log('⏭️  No spaces found, skipping devices contract test');
        return;
      }

      const spaceSeq = spaces[0].spaceSeq;
      const res = await request(app.getHttpServer())
        .get(`/api/v1/controller/control/spaces/${spaceSeq}/devices`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(SpaceDevicesResponseSchema);
      expectMatchesSchema(res.body, schema, `GET /controller/control/spaces/${spaceSeq}/devices`);
    });
  });

  // =============================================
  // Control Logs
  // =============================================

  describe('GET /api/v1/controller/control/logs', () => {
    it('응답이 ControlLogResponse 스키마와 일치해야 한다', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/controller/control/logs')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expectSuccessResponse(res.body);
      const schema = ApiSuccessSchema(ControlLogResponseSchema);
      expectMatchesSchema(res.body, schema, 'GET /controller/control/logs');
    });
  });

  // =============================================
  // Auth Guard
  // =============================================

  describe('인증 없이 요청', () => {
    it('GET /controller/presets → 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/controller/presets')
        .expect(401);

      expectErrorResponse(res.body, 'UNAUTHORIZED');
    });

    it('GET /controller/control/spaces → 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/controller/control/spaces')
        .expect(401);

      expectErrorResponse(res.body, 'UNAUTHORIZED');
    });

    it('GET /controller/control/logs → 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/controller/control/logs')
        .expect(401);

      expectErrorResponse(res.body, 'UNAUTHORIZED');
    });
  });
});
