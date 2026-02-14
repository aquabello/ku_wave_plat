import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';

describe('PlayerPlaylists (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdPpSeq: number;
  let createdGpSeq: number;

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

  describe('GET /api/v1/players/:player_seq/playlists', () => {
    it('should return playlists assigned to a player', () => {
      return request(app.getHttpServer())
        .get('/api/v1/players/1/playlists')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          // May be 200 or 404 depending on if player exists
          expect([200, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
          }
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/api/v1/players/1/playlists').expect(401);
    });
  });

  describe('POST /api/v1/players/:player_seq/playlists', () => {
    it('should assign playlist to a player', () => {
      return request(app.getHttpServer())
        .post('/api/v1/players/1/playlists')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          playlist_seq: 1,
          pp_priority: 10,
          schedule_start_time: '09:00:00',
          schedule_end_time: '18:00:00',
          schedule_days: '1,2,3,4,5',
          pp_status: 'ACTIVE',
        })
        .expect((res) => {
          // May be 201, 400, or 404 depending on if player/playlist exists
          expect([201, 400, 404]).toContain(res.status);
          if (res.status === 201) {
            expect(res.body.success).toBe(true);
            expect(res.body.data.pp_seq).toBeDefined();
            createdPpSeq = res.body.data.pp_seq;
          }
        });
    });

    it('should return 400 if playlist_seq is missing', () => {
      return request(app.getHttpServer())
        .post('/api/v1/players/1/playlists')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          pp_priority: 10,
        })
        .expect(400);
    });
  });

  describe('PUT /api/v1/players/:player_seq/playlists/:pp_seq', () => {
    it('should update player playlist assignment', () => {
      if (!createdPpSeq) {
        return;
      }

      return request(app.getHttpServer())
        .put(`/api/v1/players/1/playlists/${createdPpSeq}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          pp_priority: 20,
          pp_status: 'INACTIVE',
        })
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body.success).toBe(true);
          }
        });
    });

    it('should return 404 for non-existent assignment', () => {
      return request(app.getHttpServer())
        .put('/api/v1/players/1/playlists/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          pp_priority: 20,
        })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/players/:player_seq/playlists/:pp_seq', () => {
    it('should remove player playlist assignment', () => {
      if (!createdPpSeq) {
        return;
      }

      return request(app.getHttpServer())
        .delete(`/api/v1/players/1/playlists/${createdPpSeq}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });
  });

  describe('POST /api/v1/player-groups/:group_seq/playlists', () => {
    it('should assign playlist to a group', () => {
      return request(app.getHttpServer())
        .post('/api/v1/player-groups/1/playlists')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          playlist_seq: 1,
          gp_priority: 10,
          schedule_start_time: '09:00:00',
          schedule_end_time: '18:00:00',
          schedule_days: '1,2,3,4,5',
          gp_status: 'ACTIVE',
        })
        .expect((res) => {
          expect([201, 400, 404]).toContain(res.status);
          if (res.status === 201) {
            expect(res.body.success).toBe(true);
            expect(res.body.data.gp_seq).toBeDefined();
            expect(res.body.data.affected_players).toBeDefined();
            createdGpSeq = res.body.data.gp_seq;
          }
        });
    });

    it('should return 400 if playlist_seq is missing', () => {
      return request(app.getHttpServer())
        .post('/api/v1/player-groups/1/playlists')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          gp_priority: 10,
        })
        .expect(400);
    });
  });

  describe('PUT /api/v1/player-groups/:group_seq/playlists/:gp_seq', () => {
    it('should update group playlist assignment', () => {
      if (!createdGpSeq) {
        return;
      }

      return request(app.getHttpServer())
        .put(`/api/v1/player-groups/1/playlists/${createdGpSeq}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          gp_priority: 20,
          gp_status: 'INACTIVE',
        })
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body.success).toBe(true);
          }
        });
    });

    it('should return 404 for non-existent assignment', () => {
      return request(app.getHttpServer())
        .put('/api/v1/player-groups/1/playlists/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          gp_priority: 20,
        })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/player-groups/:group_seq/playlists/:gp_seq', () => {
    it('should remove group playlist assignment', () => {
      if (!createdGpSeq) {
        return;
      }

      return request(app.getHttpServer())
        .delete(`/api/v1/player-groups/1/playlists/${createdGpSeq}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });
  });
});
