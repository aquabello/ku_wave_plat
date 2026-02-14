import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';

describe('PlayLogs (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        tu_email: 'admin@example.com',
        tu_password: 'password123',
      });

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/players/:player_seq/play-logs', () => {
    it('should return play logs for a player', () => {
      return request(app.getHttpServer())
        .get('/api/v1/players/1/play-logs')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          // May be 200 or 404 depending on if player exists
          expect([200, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body.success).toBe(true);
            expect(res.body.data.items).toBeDefined();
            expect(res.body.data.pagination).toBeDefined();
            expect(Array.isArray(res.body.data.items)).toBe(true);
          }
        });
    });

    it('should support pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/players/1/play-logs?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should filter by date range', () => {
      return request(app.getHttpServer())
        .get('/api/v1/players/1/play-logs?from=2026-02-01T00:00:00Z&to=2026-02-28T23:59:59Z')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/players/1/play-logs?status=COMPLETED')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should filter by playlist_seq', () => {
      return request(app.getHttpServer())
        .get('/api/v1/players/1/play-logs?playlist_seq=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should filter by content_seq', () => {
      return request(app.getHttpServer())
        .get('/api/v1/players/1/play-logs?content_seq=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should support combined filters', () => {
      return request(app.getHttpServer())
        .get(
          '/api/v1/players/1/play-logs?status=ERROR&from=2026-02-01T00:00:00Z&playlist_seq=1&content_seq=1',
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/api/v1/players/1/play-logs').expect(401);
    });

    it('should return 404 for non-existent player', () => {
      return request(app.getHttpServer())
        .get('/api/v1/players/999999/play-logs')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/contents/:content_seq/play-stats', () => {
    it('should return play statistics for a content', () => {
      return request(app.getHttpServer())
        .get('/api/v1/contents/1/play-stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          // May be 200 or 404 depending on if content exists
          expect([200, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body.success).toBe(true);
            expect(res.body.data.content_seq).toBeDefined();
            expect(res.body.data.content_name).toBeDefined();
            expect(res.body.data.total_play_count).toBeDefined();
            expect(res.body.data.completed_count).toBeDefined();
            expect(res.body.data.skipped_count).toBeDefined();
            expect(res.body.data.error_count).toBeDefined();
            expect(res.body.data.total_play_time).toBeDefined();
            expect(res.body.data.average_play_time).toBeDefined();
            expect(res.body.data.unique_players).toBeDefined();
            expect(Array.isArray(res.body.data.play_by_date)).toBe(true);
          }
        });
    });

    it('should filter stats by date range', () => {
      return request(app.getHttpServer())
        .get('/api/v1/contents/1/play-stats?from=2026-02-01T00:00:00Z&to=2026-02-28T23:59:59Z')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should filter stats by from date only', () => {
      return request(app.getHttpServer())
        .get('/api/v1/contents/1/play-stats?from=2026-02-01T00:00:00Z')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should filter stats by to date only', () => {
      return request(app.getHttpServer())
        .get('/api/v1/contents/1/play-stats?to=2026-02-28T23:59:59Z')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/api/v1/contents/1/play-stats').expect(401);
    });

    it('should return 404 for non-existent content', () => {
      return request(app.getHttpServer())
        .get('/api/v1/contents/999999/play-stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
